import { InventoryMovementType } from '../enums/inventory-movement-type.enum';

export type StockMovementProps = {
  id: string;
  type: InventoryMovementType;
  quantity: number;
  productId: string;
  warehouseId: string;
  sourceWarehouseId: string | null;
  inventoryId: string;
  reference: string | null;
  note: string | null;
  userId: string | null;
  createdAt: Date;
};

export class StockMovementEntity {
  constructor(readonly props: StockMovementProps) {}
}
