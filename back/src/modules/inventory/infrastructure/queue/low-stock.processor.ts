import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EmailService } from '../../../../shared/infrastructure/email/email.service';
import { QueueService, type JobProcessor } from '../../../../shared/infrastructure/queues/queue.service';
import { JOB_NAMES, QUEUE_NAMES } from '../../../../shared/infrastructure/queues/queue.constants';
import type { LowStockJobData } from './low-stock.types';

@Injectable()
export class LowStockProcessor implements JobProcessor, OnModuleInit {
  readonly queueName = QUEUE_NAMES.INVENTORY;
  private readonly logger = new Logger(LowStockProcessor.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit(): void {
    this.queueService.registerProcessor(this);
  }

  async process(job: Job<LowStockJobData>): Promise<{ ok: boolean }> {
    const { productId, warehouseId, availableQuantity, lowStockThreshold } = job.data;

    const recipient = process.env.LOW_STOCK_ALERT_EMAIL;
    if (!recipient) {
      this.logger.warn('LOW_STOCK_ALERT_EMAIL not configured; skipping email alert');
      return { ok: false };
    }

    await this.emailService.sendLowStockAlertEmail({
      to: recipient,
      productId,
      warehouseId,
      availableQuantity,
      lowStockThreshold,
    });

    this.logger.warn(
      `Low stock alert sent for product=${productId} warehouse=${warehouseId} available=${availableQuantity} threshold=${lowStockThreshold}`,
    );

    return { ok: true };
  }
}
