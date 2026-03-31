export type InventoryCommand = {
  productId: string;
  warehouseId: string;
  quantity: number;
  reference?: string;
  note?: string;
  userId?: string;
  lowStockThreshold?: number;
};

export type TransferStockCommand = {
  productId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: number;
  reference?: string;
  note?: string;
  userId?: string;
};
