import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

type MercadoPagoPayment = {
  id: number;
  status: string;
  transaction_amount: number;
  external_reference?: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async verifyMercadoPagoPayment(paymentId: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new InternalServerErrorException('Missing MP_ACCESS_TOKEN');
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new BadRequestException('Mercado Pago verification failed');
    }

    const payment = (await response.json()) as MercadoPagoPayment;
    return this.processPayment(payment);
  }

  async handleWebhook(body: Record<string, unknown>) {
    const type = body.type ?? body.action;
    if (type !== 'payment') {
      return { ok: true, ignored: true };
    }

    const dataId = (body.data as { id?: string })?.id;
    if (!dataId) {
      return { ok: true, ignored: true };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      this.logger.warn('Webhook received but MP_ACCESS_TOKEN is not configured');
      return { ok: false, reason: 'not_configured' };
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        this.logger.warn(`Webhook: failed to fetch payment ${dataId}`);
        return { ok: false, reason: 'fetch_failed' };
      }

      const payment = (await response.json()) as MercadoPagoPayment;
      const result = await this.processPayment(payment);
      return result;
    } catch (err) {
      this.logger.error(`Webhook processing error for payment ${dataId}`, err);
      return { ok: false, reason: 'processing_error' };
    }
  }

  private async processPayment(payment: MercadoPagoPayment) {
    if (payment.status !== 'approved') {
      throw new BadRequestException(`Payment is not approved: ${payment.status}`);
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      throw new BadRequestException('Missing external_reference in Mercado Pago payment');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });
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

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        isPaid: true,
        paidAt: new Date(),
        transactionId: String(payment.id)
      }
    });

    return {
      ok: true,
      orderId: order.id,
      transactionId: String(payment.id)
    };
  }
}
