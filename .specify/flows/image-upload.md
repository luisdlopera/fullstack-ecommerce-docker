# Image Upload Flow

## Overview

Product image upload flow using MinIO/R2 storage with metadata persistence.

## Flow Diagram

```
┌──────────┐   1. Select File    ┌──────────┐   2. Validate    ┌──────────┐
│   Admin  │────────────────────▶│  Browser  │───────────────▶│   React  │
│   User   │                   │  File     │                │   Form   │
└──────────┘                   │  Input    │                └────┬─────┘
                               └───────────┘                     │
                                                                  │ 3. Submit
                                                                  │    FormData
                                                                  ▼
┌──────────┐   6. Return URL    ┌──────────┐   4. POST       ┌──────────┐
│  Admin   │◀───────────────────│  NestJS  │◀──────────────│  Next.js │
│  Panel   │                   │   API    │               │   BFF    │
│  Shows   │                   │          │               │          │
│  Image   │                   │ 5. Save   │               └──────────┘
└──────────┘                   │    to     │
                               │  Storage  │
                               └─────┬─────┘
                                     │
                                     │ Upload
                                     ▼
                              ┌──────────────┐
                              │ MinIO / R2  │
                              │  (S3-Compatible)
                              └──────────────┘
```

## Step-by-Step

### 1. Admin Selects Image

Admin user selects file in product edit form:

```tsx
// features/admin/components/product-image-upload.tsx
'use client';

export function ProductImageUpload({ productId }: { productId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const { mutate: uploadImage } = useUploadProductImage();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!isValidImage(file)) {
      toast.error('Invalid file type. Use JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('makePrimary', 'true');

      await uploadImage({ productId, formData });
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && <Spinner />}
    </div>
  );
}

function isValidImage(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
}
```

### 2. BFF Receives Request

Next.js BFF handles multipart form:

```typescript
// app/api/admin/products/[id]/images/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const makePrimary = formData.get('makePrimary') === 'true';

  if (!file) {
    return new Response('No file provided', { status: 400 });
  }

  // Forward to NestJS
  const response = await fetch(
    `${INTERNAL_API_URL}/admin/products/${params.id}/images`,
    {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
      body: formData,
    }
  );

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
```

### 3. NestJS Controller

```typescript
// modules/admin/infrastructure/http/admin.controller.ts
@Controller('admin')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Post('products/:id/images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @Param('id') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('makePrimary') makePrimary: boolean,
  ) {
    return this.uploadImageUseCase.execute(productId, file, makePrimary);
  }
}
```

### 4. Use Case: Validate & Upload

```typescript
// modules/admin/application/use-cases/upload-product-image.use-case.ts
@Injectable()
export class UploadProductImageUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private productRepo: ProductRepositoryPort,
    @Inject(STORAGE_PORT) private storage: StoragePort,
  ) {}

  async execute(
    productId: string,
    file: Express.Multer.File,
    makePrimary: boolean,
  ): Promise<ProductImage> {
    // 1. Validate product exists
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Validate file
    this.validateFile(file);

    // 3. Generate secure storage key
    const extension = path.extname(file.originalname).toLowerCase();
    const key = `products/${productId}/${uuidv4()}${extension}`;

    // 4. Upload to storage
    const publicUrl = await this.storage.upload(
      file.buffer,
      key,
      file.mimetype,
    );

    // 5. Save metadata to database
    const image = await this.productRepo.addImage(productId, {
      url: publicUrl,
      storageKey: key,
      storageProvider: process.env.STORAGE_PROVIDER,
      contentType: file.mimetype,
      sizeBytes: file.size,
      isPrimary: makePrimary,
      sortOrder: await this.getNextSortOrder(productId),
    });

    // 6. If primary, update other images
    if (makePrimary) {
      await this.productRepo.setPrimaryImage(productId, image.id);
    }

    return image;
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
      );
    }

    const maxSize = parseInt(process.env.STORAGE_MAX_FILE_SIZE_BYTES || '5242880');
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum: ${maxSize / 1024 / 1024}MB`
      );
    }
  }

  private async getNextSortOrder(productId: string): Promise<number> {
    const images = await this.productRepo.getImages(productId);
    return images.length;
  }
}
```

### 5. Storage Adapter

```typescript
// shared/infrastructure/storage/s3-compatible-storage.adapter.ts
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
      forcePathStyle: config.forcePathStyle,
    });
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;
  }

  async upload(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );

    return `${this.publicUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
```

### 6. Delete Image

```typescript
// modules/admin/application/use-cases/delete-product-image.use-case.ts
@Injectable()
export class DeleteProductImageUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private productRepo: ProductRepositoryPort,
    @Inject(STORAGE_PORT) private storage: StoragePort,
  ) {}

  async execute(productId: string, imageId: string): Promise<void> {
    // 1. Get image metadata
    const image = await this.productRepo.getImage(imageId);
    
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found');
    }

    // 2. Delete from storage
    if (image.storageKey) {
      await this.storage.delete(image.storageKey);
    }

    // 3. Delete from database
    await this.productRepo.deleteImage(imageId);
  }
}
```

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

### Upload

```
POST /api/admin/products/:id/images
Content-Type: multipart/form-data
Body:
  - file: File (required)
  - makePrimary: boolean (optional)

Response (201 Created):
{
  id: number,
  url: string,
  storageKey: string,
  isPrimary: boolean,
  sortOrder: number,
  createdAt: string
}
```

### Delete

```
DELETE /api/admin/products/:id/images/:imageId

Response (200 OK)
```

## cURL Examples

### Upload

```bash
curl -X POST "http://localhost:5001/api/admin/products/123/images" \
  -H "Authorization: Bearer <admin_jwt>" \
  -F "file=@/path/to/product-image.jpg" \
  -F "makePrimary=true"
```

### Delete

```bash
curl -X DELETE "http://localhost:5001/api/admin/products/123/images/456" \
  -H "Authorization: Bearer <admin_jwt>"
```

## Storage Configuration

### Local (MinIO)

```env
STORAGE_PROVIDER=minio
STORAGE_BUCKET=nexstore-products
STORAGE_ENDPOINT=http://localhost:5004
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_PUBLIC_URL=http://localhost:5004/nexstore-products
STORAGE_FORCE_PATH_STYLE=true
```

### Production (R2)

```env
STORAGE_PROVIDER=r2
STORAGE_BUCKET=my-bucket
STORAGE_ENDPOINT=https://xxx.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=xxx
STORAGE_SECRET_KEY=xxx
STORAGE_PUBLIC_URL=https://cdn.my-domain.com
STORAGE_FORCE_PATH_STYLE=false
```

## Image Optimization (Future)

Planned enhancements:

- **Format conversion**: Auto-convert to WebP
- **Resizing**: Generate thumbnails (150x150), medium (600x600), full
- **CDN**: Cloudflare CDN in front of storage
- **Lazy loading**: Browser-level lazy loading for PDP galleries

## References

- [Admin Module](../../backend/modules/admin.md)
- [Products Module](../../backend/modules/products.md)
- [MinIO Storage](../../infrastructure/minio-storage.md)
