import { InventoryEntity } from '../../domain/entities/inventory.entity';
import type { InventoryRecord } from '../ports/inventory-repository.port';

export function toInventoryEntity(record: InventoryRecord): InventoryEntity {
  return new InventoryEntity({
    id: record.id,
    productId: record.productId,
    warehouseId: record.warehouseId,
    availableQuantity: record.availableQuantity,
    reservedQuantity: record.reservedQuantity,
    lowStockThreshold: record.lowStockThreshold,
    allowNegativeStock: record.allowNegativeStock,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
