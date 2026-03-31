import { InventoryMovementType } from '../../domain/enums/inventory-movement-type.enum';

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export type InventoryRecord = {
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

export type InventoryMutationInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
  lowStockThreshold?: number;
  allowNegativeStock?: boolean;
  reference?: string;
  note?: string;
  userId?: string;
};

export type TransferStockInput = {
  productId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: number;
  reference?: string;
  note?: string;
  userId?: string;
};

export type ReserveByReferenceItem = {
  productId: string;
  warehouseId: string;
  quantity: number;
};

export interface InventoryRepositoryPort {
  findByProduct(productId: string): Promise<InventoryRecord[]>;
  findByWarehouse(warehouseId: string): Promise<InventoryRecord[]>;
  findByProductAndWarehouse(productId: string, warehouseId: string): Promise<InventoryRecord | null>;
  createOrGet(productId: string, warehouseId: string): Promise<InventoryRecord>;
  increase(input: InventoryMutationInput): Promise<InventoryRecord>;
  decrease(input: InventoryMutationInput): Promise<InventoryRecord>;
  adjust(input: InventoryMutationInput): Promise<InventoryRecord>;
  reserve(input: InventoryMutationInput): Promise<InventoryRecord>;
  release(input: InventoryMutationInput): Promise<InventoryRecord>;
  transfer(input: TransferStockInput): Promise<{ source: InventoryRecord; target: InventoryRecord }>;
  validateAvailableStock(productId: string, warehouseId: string, quantity: number): Promise<boolean>;
  releaseByReference(reference: string, userId?: string): Promise<void>;
  commitByReference(reference: string, userId?: string): Promise<void>;
  reserveManyByReference(items: ReserveByReferenceItem[], reference: string, userId?: string): Promise<void>;
  movementTypeEnumValue(type: InventoryMovementType): string;
}
