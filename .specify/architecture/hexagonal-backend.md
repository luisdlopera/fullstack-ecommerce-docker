# Hexagonal Architecture (Backend)

## Core Principle

**Hexagonal by Module**: Each bounded context (auth, users, products, orders, payments, admin, health, inventory) has its own layered structure. Only genuinely shared code lives in `shared/`.

## Directory Structure

```
back/src/
├── app.module.ts           # Root module
├── main.ts                 # Bootstrap
├── shared/                 # Cross-cutting concerns
│   ├── shared.module.ts    # @Global() - exports PrismaService
│   ├── domain/
│   │   └── ports/
│   │       └── storage.port.ts
│   ├── application/
│   └── infrastructure/
│       ├── prisma/
│       │   └── prisma.service.ts
│       ├── auth/
│       │   ├── guards/
│       │   ├── decorators/
│       │   └── permissions.ts
│       └── storage/
│           ├── storage.config.ts
│           └── s3-compatible-storage.adapter.ts
└── modules/
    ├── auth/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── auth.module.ts
    ├── users/
    ├── products/
    ├── orders/
    ├── payments/
    ├── admin/
    ├── inventory/
    └── health/
```

## Layer Rules

| Layer | Can Import | Cannot Import |
|-------|-----------|---------------|
| `domain/` | domain, shared/domain | Nest, Prisma, HTTP, any infrastructure |
| `application/` | domain, application, shared | PrismaClient, controllers |
| `infrastructure/` | application, domain, shared, Nest | — (everything allowed) |
| `shared/` | Nest (infra), Prisma | Feature logic from modules |

## Module Structure

Each feature module follows this structure:

```
modules/{feature}/
├── {feature}.module.ts           # NestJS module definition
├── domain/
│   ├── entities/                 # Domain entities (no framework deps)
│   └── ports/
│       └── {feature}-repository.port.ts  # Repository interfaces
├── application/
│   ├── use-cases/                # Individual use cases
│   │   └── {action}.use-case.ts
│   └── {feature}.service.ts      # Facade (legacy migration)
└── infrastructure/
    ├── http/
    │   ├── {feature}.controller.ts
    │   └── dto/
    │       └── {action}.dto.ts
    └── persistence/
        └── prisma-{feature}.repository.ts
```

## Request Flow

```
HTTP Request
    ↓
Controller (infrastructure/http)
    ↓
Use Case / Service (application)
    ↓
Repository Port (domain/ports)
    ↓
Prisma Adapter (infrastructure/persistence)
    ↓
Database
```

## Example: Products Module (Reference Implementation)

### Port Definition
```typescript
// modules/products/domain/ports/product-repository.port.ts
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepositoryPort {
  findFeatured(): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
  findWithFilters(filters: ProductFilters): Promise<PaginatedProducts>;
  // ...
}
```

### Use Case Implementation
```typescript
// modules/products/application/use-cases/get-product-by-slug.use-case.ts
@Injectable()
export class GetProductBySlugUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly repo: ProductRepositoryPort,
  ) {}

  async execute(slug: string): Promise<Product> {
    const product = await this.repo.findBySlug(slug);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
```

### Prisma Adapter
```typescript
// modules/products/infrastructure/persistence/prisma-product.repository.ts
@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: { images: true, category: true },
    });
  }
  // ...
}
```

## Dependency Injection

Modules register ports and implementations:

```typescript
// products.module.ts
@Module({
  imports: [SharedModule],
  controllers: [ProductsController],
  providers: [
    // Use cases
    GetProductBySlugUseCase,
    ListProductsUseCase,
    GetFeaturedProductsUseCase,
    // Repository port binding
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
})
export class ProductsModule {}
```

## Migration Status

| Module | Architecture | Status |
|--------|--------------|--------|
| Products | Full hexagonal | Complete |
| Inventory | Full hexagonal | Complete |
| Auth | Use cases + service | Partial |
| Users | Use cases + service | Partial |
| Orders | Use cases | Complete |
| Payments | Use cases | Complete |
| Admin | Service with use case delegation | Partial |

## Prohibited Patterns

- Importing Prisma in `domain/` layer
- Business logic in controllers
- Use cases depending on HTTP request/response types
- Mixing domain entities with validation DTOs
- Creating `shared/` "garbage" utilities used by only one module
