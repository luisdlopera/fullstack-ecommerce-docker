import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { MercadoPagoPaymentApiPort } from '../../domain/ports/mercadopago-payment-api.port';
import { MERCADOPAGO_PAYMENT_API } from '../../domain/ports/mercadopago-payment-api.port';
import { ProcessMercadoPagoPaymentUseCase } from './process-mercadopago-payment.use-case';

@Injectable()
export class VerifyMercadoPagoPaymentUseCase {
  constructor(
    @Inject(MERCADOPAGO_PAYMENT_API) private readonly mpApi: MercadoPagoPaymentApiPort,
    @Inject(ProcessMercadoPagoPaymentUseCase)
    private readonly processPayment: ProcessMercadoPagoPaymentUseCase,
  ) {}

  async execute(paymentId: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new InternalServerErrorException('Missing MP_ACCESS_TOKEN');
    }

    const payment = await this.mpApi.fetchPaymentById(paymentId, accessToken);
    if (!payment) {
      throw new BadRequestException('Mercado Pago verification failed');
    }

    return this.processPayment.execute(payment);
  }
}
