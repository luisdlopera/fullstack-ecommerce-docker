import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { MercadoPagoPaymentApiPort } from '../domain/ports/mercadopago-payment-api.port';
import { MERCADOPAGO_PAYMENT_API } from '../domain/ports/mercadopago-payment-api.port';
import type { PaymentOrderRepositoryPort } from '../domain/ports/payment-order-repository.port';
import { PAYMENT_ORDER_REPOSITORY } from '../domain/ports/payment-order-repository.port';
import type { MercadoPagoWebhookBodyDto } from '../infrastructure/http/dto/mercadopago-webhook.dto';
import { verifyMercadoPagoWebhookSignature } from '../infrastructure/http/mercadopago-webhook-signature.util';
import type { MercadoPagoPaymentRecord } from '../domain/ports/mercadopago-payment-api.port';

export type WebhookRequestMeta = {
  xSignature?: string;
  xRequestId?: string;
  dataIdQuery?: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(MERCADOPAGO_PAYMENT_API) private readonly mpApi: MercadoPagoPaymentApiPort,
    @Inject(PAYMENT_ORDER_REPOSITORY) private readonly paymentOrders: PaymentOrderRepositoryPort,
  ) {}

  async verifyMercadoPagoPayment(paymentId: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new InternalServerErrorException('Missing MP_ACCESS_TOKEN');
    }

    const payment = await this.mpApi.fetchPaymentById(paymentId, accessToken);
    if (!payment) {
      throw new BadRequestException('Mercado Pago verification failed');
    }

    return this.processPayment(payment);
  }

  async initMercadoPagoCheckout(orderId: string, userId: string, userEmail?: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new InternalServerErrorException('Missing MP_ACCESS_TOKEN');
    }

    const order = await this.paymentOrders.findOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
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

  async handleWebhook(dto: MercadoPagoWebhookBodyDto, meta: WebhookRequestMeta) {
    const skipVerify = process.env.MP_WEBHOOK_SKIP_VERIFY === 'true';
    const dataIdRaw = dto.data?.id ?? meta.dataIdQuery;
    const dataId = dataIdRaw != null && dataIdRaw !== '' ? String(dataIdRaw) : '';

    if (!skipVerify) {
      const secret = process.env.MP_WEBHOOK_SECRET;
      if (!secret) {
        this.logger.warn('MP_WEBHOOK_SECRET is not configured');
        throw new UnauthorizedException('Webhook not configured');
      }
      if (
        !verifyMercadoPagoWebhookSignature({
          secret,
          xSignature: meta.xSignature,
          xRequestId: meta.xRequestId,
          dataId,
        })
      ) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const type = dto.type ?? dto.action;
    if (type !== 'payment') {
      return { ok: true, ignored: true };
    }

    if (!dataId) {
      return { ok: true, ignored: true };
    }

    return await this.processWebhookPaymentById(dataId);
  }

  private async processWebhookPaymentById(dataId: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      this.logger.warn('Webhook received but MP_ACCESS_TOKEN is not configured');
      return { ok: false, reason: 'not_configured' };
    }

    try {
      const payment = await this.mpApi.fetchPaymentById(dataId, accessToken);
      if (!payment) {
        this.logger.warn(`Webhook: failed to fetch payment ${dataId}`);
        return { ok: false, reason: 'fetch_failed' };
      }

      return await this.processPayment(payment);
    } catch (err) {
      this.logger.error(`Webhook processing error for payment ${dataId}`, err);
      return { ok: false, reason: 'processing_error' };
    }
  }

  private async processPayment(payment: MercadoPagoPaymentRecord) {
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
