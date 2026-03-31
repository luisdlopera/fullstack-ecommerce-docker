import type { InventoryItem, InventoryMovement, InventoryMovementType, Size } from '@prisma/client';

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export type InventoryItemWithProduct = InventoryItem & {
  product: {
    id: string;
    title: string;
    slug: string;
    sku: string | null;
    isActive: boolean;
    ProductImage: { id: number; url: string; isPrimary: boolean }[];
  };
};

export type InventoryMovementWithItem = InventoryMovement & {
  inventoryItem: {
    id: string;
    productId: string;
    size: Size;
    location: string;
    product: { id: string; title: string; sku: string | null };
  };
};

export type ReserveLineItem = {
  productId: string;
  size: Size;
  quantity: number;
};

export interface InventoryRepositoryPort {
  /** List all inventory items with pagination and optional filters */
  listItems(params: {
    skip: number;
    take: number;
    search?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    productId?: string;
    location?: string;
  }): Promise<{ data: InventoryItemWithProduct[]; total: number }>;

  /** Get a single inventory item by ID */
  getItemById(itemId: string): Promise<InventoryItemWithProduct | null>;

  /** Get inventory items for a product */
  getItemsByProductId(productId: string): Promise<InventoryItemWithProduct[]>;

  /** Adjust inventory (manual admin operation) */
  adjustInventory(
    itemId: string,
    quantity: number,
    reason: string,
    userId: string,
  ): Promise<InventoryItem>;

  /** Reserve stock for an order (atomic, prevents negative available) */
  reserveStock(
    items: ReserveLineItem[],
    orderId: string,
    userId: string,
  ): Promise<void>;

  /** Release reserved stock (order cancelled/failed) */
  releaseStock(
    orderId: string,
    userId: string,
  ): Promise<void>;

  /** Commit reserved stock (order paid/confirmed) */
  commitStock(
    orderId: string,
    userId: string,
  ): Promise<void>;

  /** List movements with pagination */
  listMovements(params: {
    skip: number;
    take: number;
    inventoryItemId?: string;
    type?: InventoryMovementType;
    referenceId?: string;
  }): Promise<{ data: InventoryMovementWithItem[]; total: number }>;

  /** Get low stock items (available <= minStock and available > 0) */
  getLowStockItems(): Promise<InventoryItemWithProduct[]>;

  /** Get out-of-stock items (available = 0) */
  getOutOfStockItems(): Promise<InventoryItemWithProduct[]>;

  /** Ensure inventory items exist for a product's sizes */
  ensureItemsForProduct(
    productId: string,
    sizes: Size[],
    location?: string,
  ): Promise<InventoryItem[]>;

  /** Get inventory summary stats */
  getInventorySummary(): Promise<{
    totalItems: number;
    totalAvailable: number;
    totalReserved: number;
    totalCommitted: number;
    lowStockCount: number;
    outOfStockCount: number;
  }>;
}
