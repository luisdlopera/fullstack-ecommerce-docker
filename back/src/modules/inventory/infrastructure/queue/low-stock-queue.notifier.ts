import { Injectable, Logger } from '@nestjs/common';
import type { InventoryRecord } from '../../application/ports/inventory-repository.port';
import type { LowStockNotifierPort } from '../../application/ports/low-stock-notifier.port';

@Injectable()
export class LowStockQueueNotifier implements LowStockNotifierPort {
  private readonly logger = new Logger(LowStockQueueNotifier.name);

  async notify(inventory: InventoryRecord): Promise<void> {
    // TODO: Enqueue BullMQ job when queue infrastructure is available.
    this.logger.warn(
      `Low stock detected for product=${inventory.productId} warehouse=${inventory.warehouseId} available=${inventory.availableQuantity} threshold=${inventory.lowStockThreshold}`,
    );
  }
}
