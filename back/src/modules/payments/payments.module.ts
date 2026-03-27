import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { SharedModule } from '../../shared/shared.module';
import { PaymentsController } from './infrastructure/http/payments.controller';
import { PaymentsService } from './application/payments.service';
import { MERCADOPAGO_PAYMENT_API } from './domain/ports/mercadopago-payment-api.port';
import { MercadoPagoPaymentApiAdapter } from './infrastructure/mercadopago-payment-api.adapter';
import { PAYMENT_ORDER_REPOSITORY } from './domain/ports/payment-order-repository.port';
import { PrismaPaymentOrderRepository } from './infrastructure/persistence/prisma-payment-order.repository';

@Module({
  imports: [SharedModule, ThrottlerModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: MERCADOPAGO_PAYMENT_API, useClass: MercadoPagoPaymentApiAdapter },
    { provide: PAYMENT_ORDER_REPOSITORY, useClass: PrismaPaymentOrderRepository },
  ],
})
export class PaymentsModule {}
