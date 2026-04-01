export type InventoryProps = {
  id: string;
  productId: string;
  warehouseId: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  allowNegativeStock: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class InventoryEntity {
  constructor(readonly props: InventoryProps) {}

  availableAfter(quantity: number): number {
    return this.props.availableQuantity - quantity;
  }

  isLowStock(): boolean {
    return this.props.availableQuantity <= this.props.lowStockThreshold;
  }
}
