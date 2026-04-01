import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../../../shared/infrastructure/queues/queue.service';
import { JOB_NAMES, QUEUE_NAMES } from '../../../../shared/infrastructure/queues/queue.constants';
import type { InventoryRecord } from '../../application/ports/inventory-repository.port';
import type { LowStockNotifierPort } from '../../application/ports/low-stock-notifier.port';
import type { LowStockJobData } from './low-stock.types';

@Injectable()
export class LowStockQueueNotifier implements LowStockNotifierPort {
  private readonly logger = new Logger(LowStockQueueNotifier.name);

  constructor(private readonly queueService: QueueService) {}

  async notify(inventory: InventoryRecord): Promise<void> {
    const payload: LowStockJobData = {
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      availableQuantity: inventory.availableQuantity,
      lowStockThreshold: inventory.lowStockThreshold,
    };

    await this.queueService.addJob(QUEUE_NAMES.INVENTORY, JOB_NAMES.INVENTORY.LOW_STOCK_ALERT, payload);
    this.logger.warn(
      `Low stock queued for product=${inventory.productId} warehouse=${inventory.warehouseId} available=${inventory.availableQuantity} threshold=${inventory.lowStockThreshold}`,
    );
  }
}
