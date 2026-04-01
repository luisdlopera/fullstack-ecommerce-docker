import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { MercadoPagoPaymentApiPort } from '../../domain/ports/mercadopago-payment-api.port';
import { MERCADOPAGO_PAYMENT_API } from '../../domain/ports/mercadopago-payment-api.port';
import { PAYMENT_ORDER_REPOSITORY, type PaymentOrderRepositoryPort } from '../../domain/ports/payment-order-repository.port';

@Injectable()
export class InitMercadoPagoCheckoutUseCase {
  constructor(
    @Inject(MERCADOPAGO_PAYMENT_API) private readonly mpApi: MercadoPagoPaymentApiPort,
    @Inject(PAYMENT_ORDER_REPOSITORY) private readonly paymentOrders: PaymentOrderRepositoryPort,
  ) {}

  async execute(orderId: string, userId: string | undefined, userEmail?: string, guestCheckoutToken?: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new InternalServerErrorException('Missing MP_ACCESS_TOKEN');
    }

    const order = await this.paymentOrders.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const isAuthorized = order.userId ? order.userId === userId : order.guestCheckoutToken === guestCheckoutToken && !!guestCheckoutToken;
    if (!isAuthorized) {
      throw new ForbiddenException('You cannot pay this order');
    }

    if (order.isPaid) {
      return {
        ok: true,
        orderId: order.id,
        alreadyPaid: true,
      };
    }

    const appBaseUrl = (process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );

    const confirmationBase = `${appBaseUrl}/checkout/confirmation?orderId=${encodeURIComponent(order.id)}`;
    const notificationUrl = process.env.MP_WEBHOOK_URL;

    const checkout = await this.mpApi.initCheckout(
      {
        externalReference: order.id,
        title: `Nexstore order ${order.id}`,
        unitPrice: order.total,
        quantity: 1,
        payerEmail: userEmail,
        notificationUrl,
        backUrls: {
          success: `${confirmationBase}&status=approved`,
          pending: `${confirmationBase}&status=pending`,
          failure: `${confirmationBase}&status=failure`,
        },
      },
      accessToken,
    );

    if (!checkout?.initPoint) {
      throw new BadRequestException('Failed to initialize Mercado Pago checkout');
    }

    return {
      ok: true,
      orderId: order.id,
      checkoutId: checkout.id,
      checkoutUrl: checkout.initPoint,
      sandboxCheckoutUrl: checkout.sandboxInitPoint,
    };
  }
}
