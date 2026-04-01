import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../shared/infrastructure/queues/queue.service';
import { JOB_NAMES, QUEUE_NAMES } from '../../../../shared/infrastructure/queues/queue.constants';
import type { PaymentConfirmationMessage, PaymentNotificationPort } from '../../domain/ports/payment-notification.port';

@Injectable()
export class PaymentConfirmationQueueNotifier implements PaymentNotificationPort {
  constructor(private readonly queueService: QueueService) {}

  async enqueuePaymentConfirmation(message: PaymentConfirmationMessage): Promise<void> {
    await this.queueService.addJob(QUEUE_NAMES.PAYMENTS, JOB_NAMES.PAYMENTS.PAYMENT_CONFIRMED, message);
  }
}
