# Service Boundaries

## Bounded Contexts

Nexstore backend follows Domain-Driven Design principles with clear bounded contexts implemented as NestJS modules.

## Module Overview

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| **Auth** | Authentication, JWT, sessions | Users (for user lookup) |
| **Users** | User profiles, addresses, favorites | — (base module) |
| **Products** | Product catalog, categories, search | — (core module) |
| **Inventory** | Stock management, warehouses | Products |
| **Orders** | Order creation, lifecycle | Users, Products, Inventory |
| **Payments** | Payment processing (MercadoPago) | Orders |
| **Admin** | Admin operations, product management | Products, Inventory |
| **Health** | System health checks | — (infrastructure) |

## Communication Patterns

### Synchronous (Internal)

Modules communicate via NestJS dependency injection:

```typescript
// orders.module.ts imports inventory service
@Module({
  imports: [InventoryModule, ProductsModule, UsersModule],
  // ...
})
export class OrdersModule {}
```

### Asynchronous (Queues)

Long-running or decoupled operations use BullMQ:

```typescript
// Low stock alerts
await this.queue.add('low-stock-alert', {
  productId,
  warehouseId,
  currentStock,
});

// Payment confirmation
await this.queue.add('payment-confirmation', {
  orderId,
  paymentData,
});
```

## Dependency Graph

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Auth     │────▶│    Users    │◀────│  Favorites  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
┌─────────────┐     ┌──────▼──────┐     ┌─────────────┐
│   Health    │     │   Products  │◀────│  Categories │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Inventory  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │ Orders  │◀──│Payments │   │  Admin  │
        └─────────┘   └─────────┘   └─────────┘
```

## API Boundaries

### Public Endpoints (No Auth)

```
GET  /api/products          # List products
GET  /api/products/:slug    # Product detail
GET  /api/categories        # Categories
GET  /api/countries         # Available countries
POST /api/auth/login        # Login
POST /api/auth/register     # Register
```

### Authenticated Endpoints

```
GET    /api/auth/me              # Current user
POST   /api/auth/logout          # Logout
POST   /api/auth/refresh         # Refresh token
GET    /api/users/me/address     # Get addresses
POST   /api/users/me/address     # Add address
GET    /api/orders               # List orders
POST   /api/orders               # Create order
POST   /api/payments/mercadopago/*
```

### Admin Endpoints (Role: ADMIN+)

```
GET    /api/admin/dashboard      # Dashboard stats
POST   /api/admin/products       # Create product
PATCH  /api/admin/products/:id    # Update product
POST   /api/admin/products/:id/images  # Upload image
GET    /api/admin/inventory/*    # Inventory management
GET    /api/admin/orders         # All orders (admin view)
PATCH  /api/admin/orders/:id/status
```

## Data Ownership

Each module owns specific entities:

| Module | Primary Entities |
|--------|-----------------|
| Users | User, UserAddress, UserFavorite, RefreshToken |
| Products | Product, ProductImage, Category |
| Inventory | Inventory, StockMovement, Warehouse |
| Orders | Order, OrderItem, OrderAddress |
| Payments | PaymentTransaction (future) |

## Cross-Cutting Concerns

### Authentication
- JWT validation in `AuthGuard` (global)
- Current user injection via `@CurrentUser()` decorator
- Public route marking via `@Public()` decorator

### Authorization
- Role checking in `RolesGuard`
- Permission system via `RolePermission` entity
- Admin-only endpoints check `Roles.ADMIN` or higher

### Database
- PrismaService as single database access point
- Transactions managed at use-case level
- Connection pooling handled by Prisma

### Storage
- `StoragePort` abstraction for file operations
- S3-compatible adapter (MinIO/R2)
- Image processing and validation in use cases
