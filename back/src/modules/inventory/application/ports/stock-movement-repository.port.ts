import { InventoryMovementType } from '../../domain/enums/inventory-movement-type.enum';

export const STOCK_MOVEMENT_REPOSITORY = Symbol('STOCK_MOVEMENT_REPOSITORY');

export type StockMovementRecord = {
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

export type StockMovementFilters = {
  productId?: string;
  warehouseId?: string;
  type?: InventoryMovementType;
  reference?: string;
  page: number;
  limit: number;
};

export interface StockMovementRepositoryPort {
  findMany(filters: StockMovementFilters): Promise<{ data: StockMovementRecord[]; total: number }>;
}
