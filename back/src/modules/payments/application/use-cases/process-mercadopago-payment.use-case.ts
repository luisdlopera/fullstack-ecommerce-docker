import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MercadoPagoPaymentRecord } from '../../domain/ports/mercadopago-payment-api.port';
import { PAYMENT_ORDER_REPOSITORY, type PaymentOrderRepositoryPort } from '../../domain/ports/payment-order-repository.port';

@Injectable()
export class ProcessMercadoPagoPaymentUseCase {
  constructor(
    @Inject(PAYMENT_ORDER_REPOSITORY)
    private readonly paymentOrders: PaymentOrderRepositoryPort,
  ) {}

  async execute(payment: MercadoPagoPaymentRecord) {
    if (payment.status !== 'approved') {
      throw new BadRequestException(`Payment is not approved: ${payment.status}`);
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      throw new BadRequestException('Missing external_reference in Mercado Pago payment');
    }

    const order = await this.paymentOrders.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found for payment');

    if (order.isPaid && order.transactionId === String(payment.id)) {
      return { ok: true, orderId: order.id, alreadyProcessed: true };
    }

    if (order.total !== payment.transaction_amount) {
      throw new BadRequestException('Paid amount does not match order total');
    }

    if (order.isPaid && order.transactionId !== String(payment.id)) {
      throw new BadRequestException('Order is already paid with another transaction');
    }

    const markPaidResult = await this.paymentOrders.markOrderPaidAtomic(order.id, String(payment.id));

    if (markPaidResult.status === 'already_paid') {
      return { ok: true, orderId: order.id, alreadyProcessed: true };
    }

    if (markPaidResult.status === 'conflict') {
      throw new BadRequestException('Order is already paid with another transaction');
    }

    return {
      ok: true,
      orderId: order.id,
      transactionId: String(payment.id),
    };
  }
}
