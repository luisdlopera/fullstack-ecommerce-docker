# Products Module

## Purpose

Manages the product catalog, categories, and public-facing product information.

## Responsibilities

- Product CRUD operations
- Category management (hierarchical)
- Product search and filtering
- Featured products
- Product images (metadata)
- Country availability

## Architecture

Full hexagonal implementation - reference module for architecture patterns.

```
modules/products/
├── domain/
│   ├── entities/
│   │   └── product.entity.ts
│   └── ports/
│       └── product-repository.port.ts
├── application/
│   └── use-cases/
│       ├── get-featured-products.use-case.ts
│       ├── list-products.use-case.ts
│       ├── get-product-by-slug.use-case.ts
│       ├── get-product-stock-by-slug.use-case.ts
│       └── list-categories.use-case.ts
├── infrastructure/
│   ├── http/
│   │   ├── products.controller.ts
│   │   └── dto/
│   │       ├── product-filters.dto.ts
│   │       └── product-response.dto.ts
│   └── persistence/
│       └── prisma-product.repository.ts
└── products.module.ts
```

## Repository Port

```typescript
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findFeatured(): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
  findWithFilters(filters: ProductFilters): Promise<PaginatedProducts>;
  findCategories(): Promise<Category[]>;
  getStockBySlug(slug: string): Promise<StockInfo>;
}
```

## Use Cases

### Get Featured Products

Returns featured products for homepage display.

```typescript
class GetFeaturedProductsUseCase {
  async execute(): Promise<Product[]> {
    return this.repo.findFeatured();
  }
}
```

### List Products

Paginated product listing with comprehensive filters.

```typescript
class ListProductsUseCase {
  async execute(filters: ProductFilters): Promise<PaginatedProducts> {
    // Supports: pagination, search, gender, categories, sizes
    //           price range, tags, availability
    return this.repo.findWithFilters(filters);
  }
}
```

**Filter Parameters**:
- `query`: Full-text search (title, description)
- `gender`: men | women | kid | unisex
- `categories[]`: Category IDs
- `sizes[]`: XS, S, M, L, XL, XXL, XXXL
- `minPrice`, `maxPrice`: Price range
- `mustTag`: Require specific tag
- `anyTags[]`: Include any of these tags
- `colSlugs[]`: Collection slugs for filtering

### Get Product by Slug

Returns detailed product information.

```typescript
class GetProductBySlugUseCase {
  async execute(slug: string): Promise<Product> {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw new NotFoundException();
    return product;
  }
}
```

### Get Product Stock

Returns stock availability for a product.

```typescript
class GetProductStockBySlugUseCase {
  async execute(slug: string): Promise<StockInfo> {
    // Returns aggregated stock across all warehouses
    return this.repo.getStockBySlug(slug);
  }
}
```

### List Categories

Returns all active categories with hierarchy.

```typescript
class ListCategoriesUseCase {
  async execute(): Promise<Category[]> {
    return this.repo.findCategories();
  }
}
```

## Prisma Implementation

```typescript
@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findFeatured(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { featured: true, isActive: true },
      include: { images: true, category: true },
      take: 8,
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: { 
        images: true, 
        category: true,
        inventories: { include: { warehouse: true } },
      },
    });
  }

  async findWithFilters(filters: ProductFilters): Promise<PaginatedProducts> {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      // Build dynamic where based on filters
      ...(filters.gender && { gender: filters.gender }),
      ...(filters.categoryIds?.length && { 
        categoryId: { in: filters.categoryIds } 
      }),
      ...(filters.sizes?.length && { 
        sizes: { hasSome: filters.sizes } 
      }),
      ...(filters.query && {
        OR: [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { description: { contains: filters.query, mode: 'insensitive' } },
        ],
      }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: { images: true, category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }
}
```

## Controllers

### ProductsController

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | /api/products/featured | Featured products | Public |
| GET | /api/products | List with filters | Public |
| GET | /api/products/:slug | Product detail | Public |
| GET | /api/products/:slug/stock | Stock info | Public |

### CategoriesController

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | /api/categories | All categories | Public |

## Data Models

### Product Entity (Domain)

```typescript
export class Product {
  id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  sizes: Size[];
  gender: Gender;
  tags: string[];
  featured: boolean;
  isActive: boolean;
  images: ProductImage[];
  category: Category;
  categoryId: string;
}
```

### Prisma Schema

```prisma
model Product {
  id           String   @id @default(uuid())
  title        String
  description  String
  sku          String?  @unique
  inStock      Int      // Legacy field
  price        Float    @default(0)
  comparePrice Float?
  sizes        Size[]   @default([])
  slug         String   @unique
  tags         String[] @default([])
  gender       Gender
  featured     Boolean  @default(false)
  isActive     Boolean  @default(true)

  category   Category @relation(fields: [categoryId], references: [id])
  categoryId String

  images         ProductImage[]
  orderItems     OrderItem[]
  favorites      UserFavorite[]
  inventories    Inventory[]
  stockMovements StockMovement[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([gender])
  @@index([categoryId])
  @@index([isActive])
}

model Category {
  id          String  @id @default(uuid())
  name        String  @unique
  slug        String  @unique
  description String?
  image       String?
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)

  parentId String?
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  products Product[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([parentId])
  @@index([isActive])
}
```

## Response Format

### Product List Response

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Product Name",
      "slug": "product-name",
      "price": 99000,
      "comparePrice": 120000,
      "gender": "men",
      "sizes": ["M", "L", "XL"],
      "images": [
        { "id": 1, "url": "...", "isPrimary": true }
      ],
      "category": { "id": "...", "name": "Category" }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Product Detail Response

```json
{
  "id": "uuid",
  "title": "Product Name",
  "description": "Full description...",
  "slug": "product-name",
  "price": 99000,
  "comparePrice": 120000,
  "sku": "SKU-12345",
  "sizes": ["M", "L", "XL"],
  "gender": "men",
  "tags": ["featured", "sale"],
  "images": [
    { "id": 1, "url": "...", "isPrimary": true, "sortOrder": 0 },
    { "id": 2, "url": "...", "isPrimary": false, "sortOrder": 1 }
  ],
  "category": { 
    "id": "...", 
    "name": "Category",
    "slug": "category-slug" 
  },
  "inventories": [
    {
      "warehouse": { "name": "MAIN", "code": "MAIN" },
      "availableQuantity": 50
    }
  ]
}
```

## Frontend Integration

Frontend uses these endpoints via:
- **Server Components**: `getFeaturedProducts()`, `getProductBySlug()` in `lib/api.ts`
- **Client Components**: `shopFetch()` for dynamic data
- **Filters**: `appendProductFiltersToSearchParams()` for URL synchronization

See [frontend/features/collection.md](../frontend/features/collection.md) for frontend catalog implementation.

## References

- [Prisma Models](../prisma-models.md#core-entities)
- [API Reference](../api-reference.md#public-endpoints)
- [Inventory Module](./inventory.md) - Stock management
