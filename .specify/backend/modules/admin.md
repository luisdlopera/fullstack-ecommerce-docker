# Admin Module

## Purpose

Provides administrative functionality for managing the e-commerce platform.

## Responsibilities

- Dashboard statistics
- Product management (CRUD)
- Category management
- Order management (view, update status)
- User management
- Inventory management (via InventoryModule)
- Image uploads

## Architecture

Partial hexagonal - service acts as facade with use case delegation.

```
modules/admin/
├── domain/
│   └── ports/
│       └── admin-product-image.repository.port.ts
├── application/
│   ├── admin.service.ts              # Service facade
│   └── use-cases/
│       ├── upload-product-image.use-case.ts
│       └── delete-product-image.use-case.ts
├── infrastructure/
│   ├── http/
│   │   ├── admin.controller.ts
│   │   └── dto/
│   │       ├── create-product.dto.ts
│   │       ├── update-product.dto.ts
│   │       └── upload-image.dto.ts
│   └── persistence/
│       └── prisma-admin-product-image.repository.ts
└── admin.module.ts
```

## Service Structure

The `AdminService` currently acts as a facade that delegates to other modules:

```typescript
@Injectable()
export class AdminService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly uploadImageUseCase: UploadProductImageUseCase,
    private readonly deleteImageUseCase: DeleteProductImageUseCase,
  ) {}

  // Delegates to products module
  async createProduct(dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // Delegates to inventory module
  async adjustInventory(dto: AdjustInventoryDto) {
    return this.inventoryService.adjustStock(dto);
  }

  // Direct implementation for image handling
  async uploadProductImage(productId: string, file: File, makePrimary: boolean) {
    return this.uploadImageUseCase.execute(productId, file, makePrimary);
  }
}
```

## Use Cases

### Upload Product Image

```typescript
class UploadProductImageUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private repo: ProductRepositoryPort,
    @Inject(STORAGE_PORT) private storage: StoragePort,
  ) {}

  async execute(
    productId: string,
    file: File,
    makePrimary: boolean = false,
  ): Promise<ProductImage> {
    // 1. Validate product exists
    const product = await this.repo.findById(productId);
    if (!product) throw new NotFoundException();

    // 2. Validate file
    this.validateFile(file);

    // 3. Generate secure storage key
    const key = this.generateStorageKey(productId, file);

    // 4. Upload to storage
    const url = await this.storage.upload(file.buffer, key, file.mimetype);

    // 5. Persist metadata
    const image = await this.repo.addImage(productId, {
      url,
      storageKey: key,
      storageProvider: this.storage.provider,
      contentType: file.mimetype,
      sizeBytes: file.size,
      isPrimary: makePrimary,
    });

    // 6. If primary, unset other images
    if (makePrimary) {
      await this.repo.setPrimaryImage(productId, image.id);
    }

    return image;
  }

  private validateFile(file: File) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large');
    }
  }

  private generateStorageKey(productId: string, file: File): string {
    const ext = path.extname(file.originalname);
    return `products/${productId}/${uuid()}${ext}`;
  }
}
```

### Delete Product Image

```typescript
class DeleteProductImageUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private repo: ProductRepositoryPort,
    @Inject(STORAGE_PORT) private storage: StoragePort,
  ) {}

  async execute(productId: string, imageId: string): Promise<void> {
    // 1. Get image metadata
    const image = await this.repo.getImage(imageId);
    if (!image || image.productId !== productId) {
      throw new NotFoundException();
    }

    // 2. Delete from storage
    await this.storage.delete(image.storageKey);

    // 3. Delete metadata
    await this.repo.deleteImage(imageId);
  }
}
```

## Admin Controllers

### Dashboard

```
GET /api/admin/dashboard
Response: {
  stats: {
    totalOrders: number,
    totalRevenue: number,
    pendingOrders: number,
    lowStockItems: number,
    recentOrders: Order[],
    topProducts: Product[]
  }
}
```

### Products

```
GET    /api/admin/products          # List with pagination/filters
POST   /api/admin/products          # Create product
GET    /api/admin/products/:id      # Get product details
PATCH  /api/admin/products/:id      # Update product
DELETE /api/admin/products/:id      # Soft delete

POST   /api/admin/products/:id/images      # Upload image
DELETE /api/admin/products/:id/images/:imageId  # Delete image
```

### Categories

```
GET    /api/admin/categories        # List categories
POST   /api/admin/categories        # Create category
PATCH  /api/admin/categories/:id    # Update category
DELETE /api/admin/categories/:id      # Delete category
```

### Orders

```
GET    /api/admin/orders              # List all orders
GET    /api/admin/orders/:id          # Order details
PATCH  /api/admin/orders/:id/status  # Update status
PATCH  /api/admin/orders/:id/internal-notes  # Add notes
```

### Users

```
GET    /api/admin/users              # List users
GET    /api/admin/users/:id          # User details
PATCH  /api/admin/users/:id          # Update user (role, status)
```

## DTOs

### Create Product

```typescript
export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsEnum(Size, { each: true })
  sizes: Size[];

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### Update Product Status

```typescript
export class UpdateProductStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
```

## RBAC Protection

All admin endpoints require authentication and admin role:

```typescript
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {}
```

### Role Hierarchy

- `SUPER_ADMIN`: Full access, can manage other admins
- `ADMIN`: Full product/order management
- `MANAGER`: Limited admin access (view + limited edit)

## Future Refactoring

The Admin module should be refactored to full hexagonal architecture:

1. **Extract use cases** from AdminService
   - `CreateProductUseCase`
   - `UpdateProductUseCase`
   - `DeleteProductUseCase`
   - `ListProductsUseCase`

2. **Create repository ports**
   - `AdminProductRepositoryPort`
   - `AdminOrderRepositoryPort`

3. **Implement Prisma adapters**
   - `PrismaAdminProductRepository`
   - `PrismaAdminOrderRepository`

4. **Service becomes thin orchestrator**
   - Only coordination logic
   - No direct Prisma access

## References

- [API Reference](../api-reference.md#admin-endpoints)
- [Storage](../../infrastructure/minio-storage.md) - Image storage
- [RBAC](../security/rbac.md) - Role-based access
