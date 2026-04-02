# Orders Module

## Purpose

Manages the complete order lifecycle from creation through fulfillment.

## Responsibilities

- Order creation (cart checkout)
- Order lifecycle management (status transitions)
- Guest checkout support
- Address management
- Order history for customers
- Admin order management

## Architecture

```
modules/orders/
├── domain/
│   ├── entities/
│   │   └── order.entity.ts
│   └── ports/
│       └── order-repository.port.ts
├── application/
│   ├── use-cases/
│   │   ├── create-order.use-case.ts
│   │   ├── get-order-by-id.use-case.ts
│   │   ├── list-user-orders.use-case.ts
│   │   ├── update-order-status.use-case.ts
│   │   └── cancel-order.use-case.ts
│   └── orders.service.ts
├── infrastructure/
│   ├── http/
│   │   ├── orders.controller.ts
│   │   └── dto/
│   │       ├── create-order.dto.ts
│   │       └── update-order-status.dto.ts
│   └── persistence/
│       └── prisma-orders.repository.ts
└── orders.module.ts
```

## Use Cases

### Create Order

Handles checkout flow with inventory reservation.

```typescript
class CreateOrderUseCase {
  async execute(dto: CreateOrderDto, userId?: string): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate items and calculate totals
      const items = await this.validateItems(dto.items);
      const subTotal = this.calculateSubTotal(items);
      const tax = subTotal * this.taxRate;
      const total = subTotal + tax;

      // 2. Reserve inventory for each item
      for (const item of items) {
        await this.inventoryService.reserveStock(
          item.productId,
          item.warehouseId,
          item.quantity,
        );
      }

      // 3. Create order
      const order = await tx.order.create({
        data: {
          subTotal,
          tax,
          total,
          itemsInOrder: items.length,
          userId,
          guestEmail: dto.guestEmail,
          guestCheckoutToken: userId ? undefined : this.generateGuestToken(),
          items: {
            create: items.map(item => ({
              quantity: item.quantity,
              price: item.price,
              size: item.size,
              productId: item.productId,
            })),
          },
          address: {
            create: dto.address,
          },
        },
        include: { items: { include: { product: true } }, address: true },
      });

      return order;
    });
  }
}
```

### Get Order by ID

```typescript
class GetOrderByIdUseCase {
  async execute(orderId: string, userId?: string): Promise<Order> {
    const order = await this.repo.findById(orderId);
    
    // Verify ownership (user or guest token)
    if (order.userId && order.userId !== userId) {
      throw new ForbiddenException();
    }
    
    return order;
  }
}
```

### Update Order Status

```typescript
class UpdateOrderStatusUseCase {
  async execute(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,  // Admin user
  ): Promise<Order> {
    const order = await this.repo.findById(orderId);
    
    // Validate status transition
    if (!this.isValidTransition(order.status, newStatus)) {
      throw new BadRequestException('Invalid status transition');
    }

    // Handle payment confirmation
    if (newStatus === OrderStatus.PAID) {
      await this.confirmPayment(order);
    }

    // Handle cancellation
    if (newStatus === OrderStatus.CANCELLED) {
      await this.cancelOrder(order);
    }

    return this.repo.updateStatus(orderId, newStatus);
  }

  private async confirmPayment(order: Order) {
    // Commit reserved stock
    for (const item of order.items) {
      await this.inventoryService.commitStock(
        item.productId,
        item.warehouseId,
        item.quantity,
        order.id,
      );
    }
  }

  private async cancelOrder(order: Order) {
    // Release reserved stock
    for (const item of order.items) {
      await this.inventoryService.releaseStock(
        item.productId,
        item.warehouseId,
        item.quantity,
        order.id,
      );
    }
  }
}
```

## Data Models

### Prisma Schema

```prisma
model Order {
  id            String        @id @default(uuid())
  subTotal      Float
  tax           Float
  total         Float
  itemsInOrder  Int
  isPaid        Boolean       @default(false)
  paidAt        DateTime?
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  internalNotes String?

  user   User?   @relation(fields: [userId], references: [id])
  userId String?

  guestEmail         String?
  guestCheckoutToken String? @unique

  items         OrderItem[]
  address       OrderAddress?
  transactionId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
}

model OrderItem {
  id       String @id @default(uuid())
  quantity Int
  price    Float  // Price at time of order
  size     Size

  order   Order  @relation(fields: [orderId], references: [id])
  orderId String

  product   Product @relation(fields: [productId], references: [id])
  productId String
}

model OrderAddress {
  id         String  @id @default(uuid())
  firstName  String
  lastName   String
  address    String
  address2   String?
  postalCode String
  city       String
  phone      String

  country   Country @relation(fields: [countryId], references: [id])
  countryId String

  order   Order  @relation(fields: [orderId], references: [id])
  orderId String @unique
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

## Status Transitions

```
PENDING ──▶ PAID ──▶ PROCESSING ──▶ SHIPPED ──▶ DELIVERED
    │         │          │
    ▼         ▼          ▼
CANCELLED  REFUNDED   (return to PENDING if needed)
```

### Valid Transitions

| From | To | Inventory Action |
|------|-----|-----------------|
| PENDING | PAID | RESERVE → COMMIT |
| PENDING | CANCELLED | RESERVE → RELEASE |
| PAID | PROCESSING | None |
| PAID | CANCELLED | COMMIT → RELEASE (reverse) |
| PROCESSING | SHIPPED | None |
| SHIPPED | DELIVERED | None |
| * | REFUNDED | Depends on original state |

## Guest Checkout

Guest orders use a unique token for access:

```typescript
// Create guest token
const guestToken = crypto.randomUUID();

// Store with order
guestCheckoutToken: guestToken

// Return token to customer (email, or page URL)
// Customer uses token to view order status
```

## Controllers

### Customer Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/orders | Required | List user's orders |
| GET | /api/orders/:id | Required | Order details |
| POST | /api/orders | Required | Create order |

### Admin Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/admin/orders | Admin | All orders |
| GET | /api/admin/orders/:id | Admin | Order details |
| PATCH | /api/admin/orders/:id/status | Admin | Update status |
| PATCH | /api/admin/orders/:id/internal-notes | Admin | Add notes |

## Response Format

### Order Detail

```json
{
  "id": "uuid",
  "subTotal": 99000,
  "tax": 14850,
  "total": 113850,
  "itemsInOrder": 2,
  "isPaid": true,
  "paidAt": "2024-01-15T10:30:00Z",
  "status": "PROCESSING",
  "paymentStatus": "PAID",
  "userId": "uuid",
  "items": [
    {
      "id": "uuid",
      "quantity": 1,
      "price": 50000,
      "size": "L",
      "product": {
        "id": "uuid",
        "title": "Product Name",
        "slug": "product-name"
      }
    }
  ],
  "address": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Bogotá",
    "postalCode": "110111",
    "country": { "name": "Colombia", "isoCode": "CO" }
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## References

- [API Reference](../api-reference.md#orders)
- [Inventory Module](./inventory.md) - Stock management
- [Payments Module](./payments.md) - Payment processing
