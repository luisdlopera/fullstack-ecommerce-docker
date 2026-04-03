# Inventory Module

## Purpose

Professional stock management system with multi-warehouse support, audit trails, and automated alerts.

## Responsibilities

- Track stock by product and warehouse
- Manage stock states (available, reserved, committed)
- Record all stock movements
- Prevent overselling with atomic operations
- Generate low-stock alerts
- Support warehouse transfers

## Architecture

Full hexagonal implementation following the reference pattern.

```
modules/inventory/
├── domain/
│   ├── entities/
│   │   ├── inventory.entity.ts
│   │   └── stock-movement.entity.ts
│   └── ports/
│       └── inventory-repository.port.ts
├── application/
│   ├── inventory.service.ts
│   └── use-cases/
│       ├── reserve-stock.use-case.ts
│       ├── commit-stock.use-case.ts
│       ├── release-stock.use-case.ts
│       └── adjust-stock.use-case.ts
├── infrastructure/
│   ├── http/
│   │   ├── inventory.controller.ts
│   │   └── dto/
│   │       ├── adjust-inventory.dto.ts
│   │       └── list-inventory.dto.ts
│   ├── persistence/
│   │   └── prisma-inventory.repository.ts
│   └── queue/
│       ├── low-stock-queue.notifier.ts
│       └── low-stock.processor.ts
└── inventory.module.ts
```

## Stock States

Three states manage inventory lifecycle:

```
┌──────────┐    Reserve    ┌──────────┐    Commit    ┌───────────┐
│ Available│──────────────▶│ Reserved │─────────────▶│ Committed │
└──────────┘              └──────────┘              └───────────┘
     ▲                         │
     └─────────────────────────┘
            Release
```

- **Available**: Ready to be sold (customers can purchase)
- **Reserved**: Held for pending orders (awaiting payment)
- **Committed**: Assigned to confirmed/paid orders

## Data Models

### InventoryItem

```prisma
model Inventory {
  id                 String   @id @default(uuid())
  availableQuantity  Int      @default(0)  // Available for sale
  reservedQuantity   Int      @default(0)  // Held for pending orders
  lowStockThreshold  Int      @default(5)  // Alert threshold
  allowNegativeStock Boolean  @default(false)

  product   Product  @relation(fields: [productId], references: [id])
  productId String
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  warehouseId String

  movements StockMovement[]

  @@unique([productId, warehouseId])
  @@index([productId])
  @@index([warehouseId])
  @@index([availableQuantity])
}
```

### StockMovement

```prisma
model StockMovement {
  id                String                @id @default(uuid())
  type              InventoryMovementType
  quantity          Int
  reference         String?  // Order ID or adjustment ID
  note              String?

  inventory   Inventory  @relation(fields: [inventoryId], references: [id])
  inventoryId String
  product     Product    @relation(fields: [productId], references: [id])
  productId   String
  warehouse   Warehouse  @relation("StockMovementWarehouse", fields: [warehouseId], references: [id])
  warehouseId String
  sourceWarehouse Warehouse? @relation("StockMovementSourceWarehouse", fields: [sourceWarehouseId], references: [id])
  sourceWarehouseId String?
  user        User?      @relation(fields: [userId], references: [id])
  userId      String?

  createdAt DateTime @default(now())
}

enum InventoryMovementType {
  IN           // Purchase or return to stock
  OUT          // Sale or loss
  ADJUSTMENT   // Manual correction
  TRANSFER     // Between warehouses
  RESERVE      // Hold for order
  RELEASE      // Cancel reservation
  COMMIT       // Confirm paid order
}
```

## Use Cases

### Reserve Stock (Order Creation)

```typescript
class ReserveStockUseCase {
  async execute(
    productId: string,
    warehouseId: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Atomic check-and-update
      const updated = await tx.inventory.updateMany({
        where: {
          productId,
          warehouseId,
          availableQuantity: { gte: quantity },
        },
        data: {
          availableQuantity: { decrement: quantity },
          reservedQuantity: { increment: quantity },
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Insufficient stock');
      }

      // Record movement
      await tx.stockMovement.create({
        data: {
          type: 'RESERVE',
          quantity: -quantity,
          productId,
          warehouseId,
          reference: orderId,
        },
      });

      // Check for low stock alert
      await this.checkLowStock(tx, productId, warehouseId);
    });
  }
}
```

### Commit Stock (Payment Confirmation)

```typescript
class CommitStockUseCase {
  async execute(
    productId: string,
    warehouseId: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Move from reserved to committed
      await tx.inventory.updateMany({
        where: { productId, warehouseId },
        data: {
          reservedQuantity: { decrement: quantity },
        },
      });

      // Record movement
      await tx.stockMovement.create({
        data: {
          type: 'COMMIT',
          quantity: -quantity,
          productId,
          warehouseId,
          reference: orderId,
        },
      });
    });
  }
}
```

### Release Stock (Order Cancellation)

```typescript
class ReleaseStockUseCase {
  async execute(
    productId: string,
    warehouseId: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Return to available
      await tx.inventory.updateMany({
        where: { productId, warehouseId },
        data: {
          reservedQuantity: { decrement: quantity },
          availableQuantity: { increment: quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          type: 'RELEASE',
          quantity,
          productId,
          warehouseId,
          reference: orderId,
        },
      });
    });
  }
}
```

### Adjust Stock (Admin)

```typescript
class AdjustStockUseCase {
  async execute(
    inventoryId: string,
    quantity: number,  // Positive or negative
    reason: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { id: inventoryId },
        data: {
          availableQuantity: { increment: quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          type: 'ADJUSTMENT',
          quantity,
          inventoryId,
          note: reason,
          userId,
        },
      });
    });
  }
}
```

## Race Condition Prevention

All stock operations use Prisma's atomic `updateMany` with conditional where clauses:

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
- No overselling even under concurrent access
- Atomic check-and-update operations
- Clear error messages for stock issues

## Queue Integration (BullMQ)

### Low Stock Alerts

```typescript
// low-stock-queue.notifier.ts
@Injectable()
export class LowStockQueueNotifier {
  constructor(@InjectQueue('low-stock-alerts') private queue: Queue) {}

  async notify(productId: string, warehouseId: string, currentStock: number) {
    await this.queue.add('check-low-stock', {
      productId,
      warehouseId,
      currentStock,
      timestamp: new Date(),
    }, {
      delay: 5000,  // Debounce alerts
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 },
    });
  }
}

// low-stock.processor.ts
@Processor('low-stock-alerts')
export class LowStockProcessor {
  @Process('check-low-stock')
  async handleAlert(job: Job<LowStockJobData>) {
    const { productId, warehouseId, currentStock } = job.data;
    
    // Send notification (email, webhook, etc.)
    await this.notificationService.sendLowStockAlert({
      productId,
      warehouseId,
      currentStock,
    });
    
    // Log to audit
    this.logger.warn(`Low stock alert: ${productId} at ${warehouseId}: ${currentStock}`);
  }
}
```

## Admin API Endpoints

All endpoints require `Role.ADMIN` or higher.

### Summary
```
GET /api/admin/inventory/summary
# Returns: { totalProducts, totalStock, lowStockCount, outOfStockCount }
```

### Inventory Items
```
GET /api/admin/inventory/items
Query: page, limit, search, lowStock, outOfStock, productId, location

GET /api/admin/inventory/items/:id

GET /api/admin/inventory/products/:productId

PATCH /api/admin/inventory/items/:id/adjust
Body: { quantity: number, reason: string }
```

### Movements
```
GET /api/admin/inventory/movements
Query: page, limit, inventoryItemId, type, referenceId
```

### Alerts
```
GET /api/admin/inventory/alerts/low-stock
GET /api/admin/inventory/alerts/out-of-stock
```

## Order Integration

The `OrdersService` uses `InventoryService` for all stock operations:

```typescript
// Order creation
await this.inventoryService.reserveStock(
  line.productId,
  line.warehouseId,
  line.quantity,
  order.id,
);

// Payment confirmation
await this.inventoryService.commitStock(
  line.productId,
  line.warehouseId,
  line.quantity,
  order.id,
);

// Order cancellation
await this.inventoryService.releaseStock(
  line.productId,
  line.warehouseId,
  line.quantity,
  order.id,
);
```

## Future Enhancements

- **Multi-warehouse transfers**: `TRANSFER` movement type ready
- **Automated reorder points**: Trigger purchase orders
- **Stock reconciliation**: Rebuild from movement history
- **SKU-based variants**: Beyond size (color, material)
- **Demand forecasting**: ML-based stock predictions

## References

- [Prisma Models](../prisma-models.md#inventory-system)
- [API Reference](../api-reference.md#inventory)
- [Redis & BullMQ](../../infrastructure/redis-bullmq.md)
