import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EmailService } from '../../../../shared/infrastructure/email/email.service';
import { JOB_NAMES, QUEUE_NAMES } from '../../../../shared/infrastructure/queues/queue.constants';
import { QueueService, type JobProcessor } from '../../../../shared/infrastructure/queues/queue.service';
import type { PaymentConfirmationMessage } from '../../domain/ports/payment-notification.port';

@Injectable()
export class PaymentConfirmationProcessor implements JobProcessor, OnModuleInit {
  readonly queueName = QUEUE_NAMES.PAYMENTS;
  private readonly logger = new Logger(PaymentConfirmationProcessor.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit(): void {
    this.queueService.registerProcessor(this);
  }

  async process(job: Job<PaymentConfirmationMessage>): Promise<{ ok: boolean }> {
    if (job.name !== JOB_NAMES.PAYMENTS.PAYMENT_CONFIRMED) {
      return { ok: false };
    }

    const { email, orderId, total, transactionId, customerName } = job.data;

    await this.emailService.sendPaymentConfirmationEmail({
      to: email,
      orderId,
      total,
      transactionId,
      customerName,
    });

    this.logger.log(`Payment confirmation sent to ${email} for order ${orderId}`);
    return { ok: true };
  }
}
