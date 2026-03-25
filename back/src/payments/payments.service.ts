import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
  constructor(private readonly prisma: PrismaService) {}

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
