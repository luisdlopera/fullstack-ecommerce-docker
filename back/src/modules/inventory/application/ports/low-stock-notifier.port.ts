import type { InventoryRecord } from './inventory-repository.port';

export const LOW_STOCK_NOTIFIER = Symbol('LOW_STOCK_NOTIFIER');

export interface LowStockNotifierPort {
  notify(inventory: InventoryRecord): Promise<void>;
}
