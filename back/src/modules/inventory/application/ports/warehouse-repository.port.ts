export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export type CreateWarehouseInput = {
  name: string;
  code: string;
  location?: string;
};

export type WarehouseRecord = {
  id: string;
  name: string;
  code: string;
  location: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface WarehouseRepositoryPort {
  existsById(warehouseId: string): Promise<boolean>;
  create(input: CreateWarehouseInput): Promise<WarehouseRecord>;
}
