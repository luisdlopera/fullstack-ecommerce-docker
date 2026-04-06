import { Inject, Injectable } from '@nestjs/common';
import type { MercadoPagoPaymentRecord } from '../../domain/ports/mercadopago-payment-api.port';
import {
  PAYMENT_ORDER_REPOSITORY,
  type PaymentOrderRepositoryPort,
} from '../../domain/ports/payment-order-repository.port';
import { PAYMENT_NOTIFICATION, type PaymentNotificationPort } from '../../domain/ports/payment-notification.port';
import {
  PAYMENT_AUDIT_REPOSITORY,
  type PaymentAuditRepositoryPort,
} from '../../domain/ports/payment-audit.repository.port';
import { BadRequestError, NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class ProcessMercadoPagoPaymentUseCase {
  constructor(
    @Inject(PAYMENT_ORDER_REPOSITORY)
    private readonly paymentOrders: PaymentOrderRepositoryPort,
    @Inject(PAYMENT_NOTIFICATION)
    private readonly paymentNotifications: PaymentNotificationPort,
    @Inject(PAYMENT_AUDIT_REPOSITORY)
    private readonly paymentAudit: PaymentAuditRepositoryPort,
  ) {}

  async execute(payment: MercadoPagoPaymentRecord) {
    if (payment.status !== 'approved') {
      throw new BadRequestError(`Payment is not approved: ${payment.status}`);
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      throw new BadRequestError('Missing external_reference in Mercado Pago payment');
    }

    const order = await this.paymentOrders.findOrderById(orderId);
    if (!order) throw new NotFoundError('Order not found for payment');

    if (order.isPaid && order.transactionId === String(payment.id)) {
      return { ok: true, orderId: order.id, alreadyProcessed: true };
    }

    if (order.total !== payment.transaction_amount) {
      throw new BadRequestError('Paid amount does not match order total');
    }

    if (order.isPaid && order.transactionId !== String(payment.id)) {
      throw new BadRequestError('Order is already paid with another transaction');
    }

    const markPaidResult = await this.paymentOrders.markOrderPaidAtomic(order.id, String(payment.id));

    if (markPaidResult.status === 'already_paid') {
      return { ok: true, orderId: order.id, alreadyProcessed: true };
    }

    if (markPaidResult.status === 'conflict') {
      throw new BadRequestError('Order is already paid with another transaction');
    }

    const recipient = await this.paymentOrders.findPaymentRecipient(order.id);
    if (recipient?.email && markPaidResult.status === 'paid' && payment.id != null) {
      await this.paymentNotifications.enqueuePaymentConfirmation({
        email: recipient.email,
        orderId: recipient.orderId,
        total: recipient.total,
        transactionId: String(payment.id),
        customerName: recipient.name,
      });
    }

    if (markPaidResult.status === 'paid' && payment.id != null) {
      await this.paymentAudit.create({
        actorId: order.userId ?? 'guest',
        action: 'payment.confirmed',
        entityType: 'order',
        entityId: order.id,
        metadata: {
          transactionId: String(payment.id),
          total: order.total,
        },
      });
    }

    return {
      ok: true,
      orderId: order.id,
      transactionId: String(payment.id),
    };
  }
}
