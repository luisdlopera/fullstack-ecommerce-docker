# Inventory Update Flow

## Overview

Stock movement and inventory adjustment flow for warehouse management.

## Flow Diagram

```
Admin/Order Action
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Manual     │  │   Order      │  │   Payment    │
│  Adjustment  │  │   Creation   │  │ Confirmation │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 │                 │
       ▼                 ▼                 ▼
┌────────────────────────────────────────────────────┐
│              Inventory Service                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   ADJUST    │  │   RESERVE   │  │   COMMIT    │  │
│  │  (Manual)   │  │  (Pending)  │  │   (Paid)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
└─────────┼────────────────┼────────────────┼──────────┘
          │                │                │
          ▼                ▼                ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ Transaction  │  │ Transaction  │  │ Transaction  │
   │  Update DB   │  │  Update DB   │  │  Update DB   │
   │  + Record    │  │  + Record    │  │  + Record    │
   │  Movement    │  │  Movement    │  │  Movement    │
   └──────────────┘  └──────────────┘  └──────────────┘
```

## Movement Types

| Type | Trigger | Stock Change |
|------|---------|--------------|
| `IN` | Purchase, return | Available +N |
| `OUT` | Sale, loss | Available -N |
| `ADJUSTMENT` | Manual correction | Available +/-N |
| `TRANSFER` | Between warehouses | Source -N, Dest +N |
| `RESERVE` | Order created | Available -N, Reserved +N |
| `RELEASE` | Order cancelled | Reserved -N, Available +N |
| `COMMIT` | Payment confirmed | Reserved -N, Committed +N |

## Stock States

```
Available ──RESERVE──▶ Reserved ──COMMIT──▶ Committed
    ▲                      │                     │
    │                      │                     │
    └──RELEASE─────────────┘                     │
                                               │
                                               ▼ (fulfilled)
                                         Removed from stock
```

## Step-by-Step Flows

### 1. Manual Adjustment (Admin)

Admin manually adjusts stock levels:

```typescript
// PATCH /api/admin/inventory/items/:id/adjust
// Body: { quantity: 10, reason: "Physical count correction" }

class AdjustStockUseCase {
  async execute(
    inventoryId: string,
    quantity: number,  // Can be positive or negative
    reason: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Update inventory
      const updated = await tx.inventory.update({
        where: { id: inventoryId },
        data: {
          availableQuantity: { increment: quantity },
        },
      });

      // 2. Record movement
      await tx.stockMovement.create({
        data: {
          type: 'ADJUSTMENT',
          quantity,
          inventoryId,
          productId: updated.productId,
          warehouseId: updated.warehouseId,
          note: reason,
          userId,
        },
      });

      // 3. Check for low stock alert
      if (updated.availableQuantity <= updated.lowStockThreshold) {
        await this.queueService.addLowStockAlert({
          productId: updated.productId,
          warehouseId: updated.warehouseId,
          currentStock: updated.availableQuantity,
          threshold: updated.lowStockThreshold,
        });
      }
    });
  }
}
```

### 2. Reserve Stock (Order Creation)

When customer creates an order:

```typescript
class ReserveStockUseCase {
  async execute(
    productId: string,
    warehouseId: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Atomic check-and-update with guard
      const updated = await tx.inventory.updateMany({
        where: {
          productId,
          warehouseId,
          availableQuantity: { gte: quantity },  // Guard: must have enough
        },
        data: {
          availableQuantity: { decrement: quantity },
          reservedQuantity: { increment: quantity },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Insufficient stock available');
      }

      // 2. Get updated inventory for movement record
      const inventory = await tx.inventory.findFirst({
        where: { productId, warehouseId },
      });

      // 3. Record movement
      await tx.stockMovement.create({
        data: {
          type: 'RESERVE',
          quantity: -quantity,
          inventoryId: inventory.id,
          productId,
          warehouseId,
          reference: orderId,
          note: `Reserved for order ${orderId}`,
        },
      });
    });
  }
}
```

### 3. Commit Stock (Payment Confirmed)

When payment is received:

```typescript
class CommitStockUseCase {
  async execute(
    productId: string,
    warehouseId: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Move from reserved to committed
      await tx.inventory.updateMany({
        where: { productId, warehouseId },
        data: {
          reservedQuantity: { decrement: quantity },
        },
      });

      // 2. Record movement
      const inventory = await tx.inventory.findFirst({
        where: { productId, warehouseId },
      });

      await tx.stockMovement.create({
        data: {
          type: 'COMMIT',
          quantity: -quantity,
          inventoryId: inventory.id,
          productId,
          warehouseId,
          reference: orderId,
          note: `Committed for order ${orderId}`,
        },
      });
    });
  }
}
```

### 4. Release Stock (Order Cancelled)

When order is cancelled or payment fails:

```typescript
class ReleaseStockUseCase {
  async execute(
    productId: string,
    warehouseId: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Return to available
      await tx.inventory.updateMany({
        where: { productId, warehouseId },
        data: {
          reservedQuantity: { decrement: quantity },
          availableQuantity: { increment: quantity },
        },
      });

      // 2. Record movement
      const inventory = await tx.inventory.findFirst({
        where: { productId, warehouseId },
      });

      await tx.stockMovement.create({
        data: {
          type: 'RELEASE',
          quantity,
          inventoryId: inventory.id,
          productId,
          warehouseId,
          reference: orderId,
          note: `Released from order ${orderId}`,
        },
      });
    });
  }
}
```

## Race Condition Prevention

All stock operations use atomic `updateMany` with conditional where:

```typescript
const updated = await tx.inventory.updateMany({
  where: {
    id: inventoryItem.id,
    availableQuantity: { gte: line.quantity },  // Guard condition
  },
  data: {
    availableQuantity: { decrement: line.quantity },
    reservedQuantity: { increment: line.quantity },
  },
});

if (updated.count === 0) {
  throw new BadRequestException('Insufficient stock');
}
```

This ensures:
- No overselling even with concurrent requests
- Atomic check-and-update
- Clear error messages

## Data Models

### Inventory

```prisma
model Inventory {
  id                 String   @id @default(uuid())
  availableQuantity  Int      @default(0)  // Ready to sell
  reservedQuantity   Int      @default(0)  // Held for pending orders
  lowStockThreshold  Int      @default(5)  // Alert threshold
  allowNegativeStock Boolean  @default(false)

  product   Product  @relation(fields: [productId], references: [id])
  productId String
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  warehouseId String

  movements StockMovement[]

  @@unique([productId, warehouseId])
}
```

### Stock Movement

```prisma
model StockMovement {
  id                String                @id @default(uuid())
  type              InventoryMovementType
  quantity          Int                   // Positive = in, Negative = out
  reference         String?               // Order ID or adjustment ID
  note              String?

  inventory   Inventory  @relation(fields: [inventoryId], references: [id])
  inventoryId String
  product     Product    @relation(fields: [productId], references: [id])
  productId   String
  warehouse   Warehouse  @relation(fields: [warehouseId], references: [id])
  warehouseId String
  user        User?      @relation(fields: [userId], references: [id])
  userId      String?

  createdAt DateTime @default(now())
}

enum InventoryMovementType {
  IN
  OUT
  ADJUSTMENT
  TRANSFER
  RESERVE
  RELEASE
  COMMIT
}
```

## API Endpoints

### Adjust Stock

```
PATCH /api/admin/inventory/items/:id/adjust
Body: {
  quantity: number,    // Positive or negative
  reason: string       // Required for audit trail
}

Response: {
  id: string,
  availableQuantity: number,
  reservedQuantity: number,
}
```

### Get Inventory Movements

```
GET /api/admin/inventory/movements
Query: {
  page?: number,
  limit?: number,
  inventoryItemId?: string,
  type?: InventoryMovementType,
  referenceId?: string
}

Response: {
  data: StockMovement[],
  meta: { page, limit, total }
}
```

### Get Low Stock Alerts

```
GET /api/admin/inventory/alerts/low-stock

Response: {
  data: Inventory[]  // Items where available <= threshold
}
```

## Queue Integration

### Low Stock Alerts

```typescript
// When stock is adjusted below threshold
await this.queue.add('low-stock-alert', {
  productId,
  warehouseId,
  currentStock,
  threshold,
});

// Processor sends notification
@Processor('low-stock-alerts')
class LowStockProcessor {
  @Process('check-low-stock')
  async handle(job: Job) {
    await this.notificationService.sendAlert(job.data);
  }
}
```

## Order Integration

The `OrdersService` orchestrates inventory during order lifecycle:

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private inventoryService: InventoryService,
    // ...
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // Reserve stock for each item
    for (const item of dto.items) {
      await this.inventoryService.reserveStock(
        item.productId,
        item.warehouseId,
        item.quantity,
        orderId,
      );
    }
    // ... create order
  }

  async confirmPayment(orderId: string) {
    // Commit reserved stock
    for (const item of order.items) {
      await this.inventoryService.commitStock(
        item.productId,
        item.warehouseId,
        item.quantity,
        orderId,
      );
    }
  }

  async cancelOrder(orderId: string) {
    // Release reserved stock
    for (const item of order.items) {
      await this.inventoryService.releaseStock(
        item.productId,
        item.warehouseId,
        item.quantity,
        orderId,
      );
    }
  }
}
```

## Audit Trail

Every stock change is recorded:

```typescript
// Example movement records
{
  type: 'ADJUSTMENT',
  quantity: 50,
  reference: null,
  note: 'Initial stock from supplier',
  userId: 'admin-123',
  createdAt: '2024-01-15T10:00:00Z'
}

{
  type: 'RESERVE',
  quantity: -2,
  reference: 'order-456',
  note: 'Reserved for order order-456',
  userId: null,  // System action
  createdAt: '2024-01-15T11:30:00Z'
}

{
  type: 'COMMIT',
  quantity: -2,
  reference: 'order-456',
  note: 'Committed for order order-456',
  userId: null,
  createdAt: '2024-01-15T11:35:00Z'
}
```

## References

- [Inventory Module](../../backend/modules/inventory.md)
- [Orders Module](../../backend/modules/orders.md)
- [Redis & BullMQ](../../infrastructure/redis-bullmq.md)
