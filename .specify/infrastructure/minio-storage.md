# MinIO / S3 Storage

## Overview

Nexstore uses **MinIO** for local development and **Cloudflare R2** (or AWS S3) for production.

## Architecture

```
┌──────────┐    Upload Request    ┌──────────┐    Store File    ┌──────────┐
│  Client  │────────────────────▶│ NestJS   │───────────────▶│  MinIO   │
│          │                     │  API     │                │  / R2    │
│          │◀──────────────────│          │◀───────────────│          │
└──────────┘   Public URL       └──────────┘   Return URL   └──────────┘
     │                              │
     │                              │
     ▼                              ▼
  Display Image               Save Metadata
                              (Prisma)
```

## Storage Port

Hexagonal architecture abstraction:

```typescript
// shared/domain/ports/storage.port.ts
export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
  upload(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<string>;  // Returns public URL

  delete(key: string): Promise<void>;

  getPublicUrl(key: string): string;
}
```

## S3-Compatible Adapter

```typescript
// shared/infrastructure/storage/s3-compatible-storage.adapter.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3CompatibleStorageAdapter implements StoragePort {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: config.forcePathStyle,  // Required for MinIO
    });
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    }));

    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
```

## Configuration

### Local (MinIO)

```env
STORAGE_PROVIDER=minio
STORAGE_BUCKET=nexstore-products
STORAGE_REGION=us-east-1
STORAGE_ENDPOINT=http://localhost:5004
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_PUBLIC_URL=http://localhost:5004/nexstore-products
STORAGE_FORCE_PATH_STYLE=true
STORAGE_MAX_FILE_SIZE_BYTES=5242880  # 5MB
```

### Production (Cloudflare R2)

```env
STORAGE_PROVIDER=r2
STORAGE_BUCKET=<bucket-name>
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=<r2-access-key>
STORAGE_SECRET_KEY=<r2-secret-key>
STORAGE_PUBLIC_URL=https://<your-domain-or-r2-dev-url>
STORAGE_FORCE_PATH_STYLE=false
```

## Image Upload Flow

### 1. Controller receives file

```typescript
// admin.controller.ts
@Post('products/:id/images')
@UseInterceptors(FileInterceptor('file'))
uploadImage(
  @Param('id') productId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body('makePrimary') makePrimary: boolean,
) {
  return this.uploadImageUseCase.execute(productId, file, makePrimary);
}
```

### 2. Use case validates and processes

```typescript
// upload-product-image.use-case.ts
async execute(
  productId: string,
  file: File,
  makePrimary: boolean,
): Promise<ProductImage> {
  // 1. Validate file
  this.validateFile(file);

  // 2. Generate secure key
  const key = `products/${productId}/${uuidv4()}.webp`;

  // 3. Upload to storage
  const url = await this.storage.upload(file.buffer, key, file.mimetype);

  // 4. Save metadata
  const image = await this.productRepo.addImage(productId, {
    url,
    storageKey: key,
    storageProvider: process.env.STORAGE_PROVIDER,
    contentType: file.mimetype,
    sizeBytes: file.size,
    isPrimary: makePrimary,
  });

  return image;
}

private validateFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException('Invalid file type');
  }

  const maxSize = parseInt(process.env.STORAGE_MAX_FILE_SIZE_BYTES);
  if (file.size > maxSize) {
    throw new BadRequestException(`File too large (max ${maxSize / 1024 / 1024}MB)`);
  }
}
```

### 3. Delete image

```typescript
// delete-product-image.use-case.ts
async execute(productId: string, imageId: string): Promise<void> {
  const image = await this.productRepo.getImage(imageId);
  
  // Delete from storage
  await this.storage.delete(image.storageKey);
  
  // Delete from database
  await this.productRepo.deleteImage(imageId);
}
```

## Security

### File Validation

- MIME type whitelist: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- File size limit: 5MB default
- No execution of uploaded files
- Random filename (UUID) - no user input in filenames

### Access Control

- **Development**: Bucket is public (simplified for local dev)
- **Production**: Use signed URLs or CDN with access controls
- **Admin only**: Upload/delete endpoints require admin role

## Database Schema

```prisma
model ProductImage {
  id              Int      @id @default(autoincrement())
  url             String
  storageProvider String?  // minio, r2, s3
  storageKey      String?  @unique
  contentType     String?  // image/jpeg, image/webp
  sizeBytes       Int?
  altText         String?
  sortOrder       Int      @default(0)
  isPrimary       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  product   Product @relation(fields: [productId], references: [id])
  productId String

  @@index([productId, sortOrder])
  @@index([productId, isPrimary])
}
```

## API Endpoints

### Admin Image Endpoints

```
POST   /api/admin/products/:id/images
Content-Type: multipart/form-data
Body: { file: File, makePrimary?: boolean }
Response: {
  id: number,
  url: string,
  storageKey: string,
  isPrimary: boolean,
  productId: string
}

DELETE /api/admin/products/:id/images/:imageId
Response: 200 OK
```

### Example Upload (curl)

```bash
curl -X POST "http://localhost:5001/api/admin/products/<productId>/images" \
  -H "Authorization: Bearer <admin_jwt>" \
  -F "file=@/path/to/image.webp" \
  -F "makePrimary=true"
```

## MinIO Console

Access the MinIO web interface at: `http://localhost:5005`

- Access Key: `minioadmin`
- Secret Key: `minioadmin`
- Default Bucket: `nexstore-products`

## Image Optimization (Future)

Planned enhancements:

- **WebP conversion**: Auto-convert uploads to WebP
- **Resizing**: Multiple sizes (thumbnail, medium, full)
- **CDN**: Cloudflare CDN for global delivery
- **Lazy loading**: Browser-level lazy loading for PDP

## References

- [Admin Module](../../backend/modules/admin.md)
- [Products Module](../../backend/modules/products.md)
- [MinIO Docs](https://min.io/docs/minio/linux/index.html)
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)
