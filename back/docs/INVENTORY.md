# Inventory Module – Nexstore

## Overview

The inventory module provides professional stock management for Nexstore, replacing the simple `Product.inStock` field with a granular, auditable system that tracks stock by **product variant** (size) and **location**.

## Data Model

### InventoryItem

Each `InventoryItem` represents the stock for a specific product + size + location combination.

| Field        | Type    | Description                                    |
|-------------|---------|------------------------------------------------|
| `id`        | UUID    | Primary key                                    |
| `productId` | UUID    | FK to Product                                  |
| `size`      | Enum    | The size variant (XS, S, M, L, XL, XXL, XXXL) |
| `location`  | String  | Warehouse/location (default: "MAIN")           |
| `available` | Int     | Units available for sale                       |
| `reserved`  | Int     | Units held by pending/unpaid orders            |
| `committed` | Int     | Units assigned to confirmed/paid orders        |
| `minStock`  | Int     | Low-stock alert threshold (default: 5)         |

**Unique constraint**: `(productId, size, location)` – one record per variant per location.

### InventoryMovement

Every stock change is recorded as a movement for full audit trail.

| Field              | Type    | Description                                           |
|-------------------|---------|-------------------------------------------------------|
| `id`              | UUID    | Primary key                                           |
| `inventoryItemId` | UUID    | FK to InventoryItem                                   |
| `type`            | Enum    | IN, OUT, ADJUSTMENT, RESERVATION, COMMIT, RELEASE, RETURN |
| `quantity`        | Int     | Amount changed (negative = decrease, positive = increase) |
| `reason`          | String  | Human-readable reason                                 |
| `referenceType`   | String? | Entity type (e.g., "order")                           |
| `referenceId`     | String? | Entity ID                                             |
| `userId`          | String? | Who made the change                                   |
| `createdAt`       | DateTime | Timestamp                                            |

## Stock States

```
┌──────────┐    Reserve    ┌──────────┐    Commit    ┌───────────┐
│ Available │──────────────▶│ Reserved │─────────────▶│ Committed │
└──────────┘◀──────────────└──────────┘              └───────────┘
                Release
```

- **Available**: Ready to be sold
- **Reserved**: Held for a pending order (customer hasn't paid yet)
- **Committed**: Assigned to a confirmed/paid order

## Business Rules

1. **No overselling**: You cannot sell more than the `available` count. The reserve operation uses an atomic `updateMany` with a `{ available: { gte: quantity } }` guard.

2. **Reserve on order creation**: When a customer creates an order, the system:
   - Decreases `available` by the ordered quantity
   - Increases `reserved` by the same amount
   - Creates a `RESERVATION` movement

3. **Release on cancellation/failure**: If an order is cancelled or payment fails:
   - Decreases `reserved` by the amount
   - Increases `available` by the same amount
   - Creates a `RELEASE` movement

4. **Commit on payment**: When payment is confirmed:
   - Decreases `reserved` by the amount
   - Increases `committed` by the same amount
   - Creates a `COMMIT` movement

5. **Manual adjustments**: Admins can adjust stock with a mandatory reason, creating an `ADJUSTMENT` movement.

6. **Idempotency**: Release and commit operations check for existing movements before acting, preventing double-processing.

7. **Audit trail**: Every change is recorded with who, when, why, and related reference.

## API Endpoints

All endpoints are under `/admin/inventory` and require admin authentication.

### Summary
- `GET /admin/inventory/summary` – Returns aggregated inventory stats

### Items
- `GET /admin/inventory/items` – List inventory items (paginated, filterable)
  - Query params: `page`, `limit`, `search`, `lowStock`, `outOfStock`, `productId`, `location`
- `GET /admin/inventory/items/:id` – Get single item
- `GET /admin/inventory/products/:productId` – Get items by product
- `PATCH /admin/inventory/items/:id/adjust` – Manual stock adjustment
  - Body: `{ quantity: number, reason: string }`

### Movements
- `GET /admin/inventory/movements` – List movements (paginated)
  - Query params: `page`, `limit`, `inventoryItemId`, `type`, `referenceId`

### Alerts
- `GET /admin/inventory/alerts/low-stock` – Items with available <= minStock
- `GET /admin/inventory/alerts/out-of-stock` – Items with available = 0

## Architecture

The module follows hexagonal architecture:

```
inventory/
├── domain/
│   └── ports/
│       └── inventory-repository.port.ts    # Repository interface
├── application/
│   └── inventory.service.ts                # Business logic
├── infrastructure/
│   ├── http/
│   │   ├── inventory.controller.ts         # REST controller
│   │   └── dto/
│   │       └── adjust-inventory.dto.ts     # Input validation
│   └── persistence/
│       └── prisma-inventory.repository.ts  # Prisma implementation
└── inventory.module.ts                     # NestJS module
```

## Order Integration

The `OrdersService` now uses `InventoryService` for:
- **Create order**: `reserveStock()` before creating the order record
- **Mark as paid**: `commitStock()` when payment is confirmed
- **Cancel order**: `releaseStock()` when order is cancelled

## Race Condition Prevention

The system uses Prisma's `updateMany` with conditional where clauses:

```typescript
const updated = await tx.inventoryItem.updateMany({
  where: {
    id: inventoryItem.id,
    available: { gte: line.quantity }, // Guard against negative stock
  },
  data: {
    available: { decrement: line.quantity },
    reserved: { increment: line.quantity },
  },
});

if (updated.count === 0) {
  throw new BadRequestException('Insufficient stock');
}
```

This ensures atomic operations even under concurrent access.

## Future Considerations

- **Multi-warehouse**: The `location` field is already in place. Extend with a `Warehouse` model for full multi-location support.
- **Batch operations**: Add bulk adjust endpoint for admin efficiency.
- **Automated reorder alerts**: Email/webhook notifications when stock hits minimum.
- **Stock reconciliation**: Script to rebuild stock from movement history.
- **SKU-based variant matching**: Currently matches by product + size. Could extend to color/variant.
