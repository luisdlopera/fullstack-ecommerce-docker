export type LowStockJobData = {
  productId: string;
  warehouseId: string;
  availableQuantity: number;
  lowStockThreshold: number;
};
