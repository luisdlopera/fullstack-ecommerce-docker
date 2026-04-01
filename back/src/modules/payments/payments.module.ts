import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { SharedModule } from '../../shared/shared.module';
import { PaymentsController } from './infrastructure/http/payments.controller';
import { MERCADOPAGO_PAYMENT_API } from './domain/ports/mercadopago-payment-api.port';
import { MercadoPagoPaymentApiAdapter } from './infrastructure/mercadopago-payment-api.adapter';
import { PAYMENT_ORDER_REPOSITORY } from './domain/ports/payment-order-repository.port';
import { PAYMENT_NOTIFICATION } from './domain/ports/payment-notification.port';
import { PAYMENT_AUDIT_REPOSITORY } from './domain/ports/payment-audit.repository.port';
import { PrismaPaymentOrderRepository } from './infrastructure/persistence/prisma-payment-order.repository';
import { PrismaPaymentAuditRepository } from './infrastructure/persistence/prisma-payment-audit.repository';
import { PaymentConfirmationQueueNotifier } from './infrastructure/queue/payment-confirmation.notifier';
import { PaymentConfirmationProcessor } from './infrastructure/queue/payment-confirmation.processor';
import { InitMercadoPagoCheckoutUseCase } from './application/use-cases/init-mercadopago-checkout.use-case';
import { VerifyMercadoPagoPaymentUseCase } from './application/use-cases/verify-mercadopago-payment.use-case';
import { SimulatePaymentUseCase } from './application/use-cases/simulate-payment.use-case';
import { HandleMercadoPagoWebhookUseCase } from './application/use-cases/handle-mercadopago-webhook.use-case';
import { ProcessMercadoPagoPaymentUseCase } from './application/use-cases/process-mercadopago-payment.use-case';

@Module({
  imports: [SharedModule, ThrottlerModule],
  controllers: [PaymentsController],
  providers: [
    { provide: MERCADOPAGO_PAYMENT_API, useClass: MercadoPagoPaymentApiAdapter },
    { provide: PAYMENT_ORDER_REPOSITORY, useClass: PrismaPaymentOrderRepository },
    { provide: PAYMENT_AUDIT_REPOSITORY, useClass: PrismaPaymentAuditRepository },
    { provide: PAYMENT_NOTIFICATION, useClass: PaymentConfirmationQueueNotifier },
    PaymentConfirmationProcessor,
    ProcessMercadoPagoPaymentUseCase,
    VerifyMercadoPagoPaymentUseCase,
    InitMercadoPagoCheckoutUseCase,
    SimulatePaymentUseCase,
    HandleMercadoPagoWebhookUseCase,
  ],
})
export class PaymentsModule {}
