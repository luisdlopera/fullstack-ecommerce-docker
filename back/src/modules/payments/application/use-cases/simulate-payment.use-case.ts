import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PAYMENT_ORDER_REPOSITORY, type PaymentOrderRepositoryPort } from '../../domain/ports/payment-order-repository.port';

@Injectable()
export class SimulatePaymentUseCase {
  constructor(@Inject(PAYMENT_ORDER_REPOSITORY) private readonly paymentOrders: PaymentOrderRepositoryPort) {}

  async execute(orderId: string, userId?: string, guestCheckoutToken?: string) {
    const order = await this.paymentOrders.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const isAuthorized = order.userId ? order.userId === userId : order.guestCheckoutToken === guestCheckoutToken && !!guestCheckoutToken;

    if (!isAuthorized) {
      throw new ForbiddenException('You cannot pay this order');
    }

    if (order.isPaid) {
      return { ok: true, orderId: order.id, alreadyPaid: true };
    }

    const fakeTransactionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const markPaidResult = await this.paymentOrders.markOrderPaidAtomic(order.id, fakeTransactionId);

    if (markPaidResult.status === 'already_paid') {
      return { ok: true, orderId: order.id, alreadyProcessed: true };
    }

    if (markPaidResult.status === 'conflict') {
      throw new BadRequestException('Order is already paid with another transaction');
    }

    return {
      ok: true,
      orderId: order.id,
      transactionId: fakeTransactionId,
      simulated: true,
    };
  }
}
