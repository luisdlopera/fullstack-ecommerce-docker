import { BadRequestException, Body, Controller, Headers, Inject, Post, Query } from '@nestjs/common';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import { RateLimit } from '../../../../rate-limit/infrastructure/decorators/rate-limit.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { InitMercadoPagoDto } from './dto/init-mercadopago.dto';
import { VerifyMercadoPagoDto } from './dto/verify-mercadopago.dto';
import { MercadoPagoWebhookBodyDto } from './dto/mercadopago-webhook.dto';
import { InitMercadoPagoCheckoutUseCase } from '../../application/use-cases/init-mercadopago-checkout.use-case';
import { VerifyMercadoPagoPaymentUseCase } from '../../application/use-cases/verify-mercadopago-payment.use-case';
import { SimulatePaymentUseCase } from '../../application/use-cases/simulate-payment.use-case';
import { HandleMercadoPagoWebhookUseCase } from '../../application/use-cases/handle-mercadopago-webhook.use-case';

@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(InitMercadoPagoCheckoutUseCase)
    private readonly initCheckoutUseCase: InitMercadoPagoCheckoutUseCase,
    @Inject(VerifyMercadoPagoPaymentUseCase)
    private readonly verifyPaymentUseCase: VerifyMercadoPagoPaymentUseCase,
    @Inject(SimulatePaymentUseCase)
    private readonly simulatePaymentUseCase: SimulatePaymentUseCase,
    @Inject(HandleMercadoPagoWebhookUseCase)
    private readonly webhookUseCase: HandleMercadoPagoWebhookUseCase,
  ) {}

  @Public()
  @Post('mercadopago/init')
  initMercadoPagoCheckout(@CurrentUser() user: JwtPayload | undefined, @Body() dto: InitMercadoPagoDto) {
    return this.initCheckoutUseCase.execute(
      dto.orderId,
      user?.sub,
      user?.email ?? dto.guestEmail,
      dto.guestCheckoutToken,
    );
  }

  @Public()
  @RateLimit({ limit: 30, ttl: 60, policy: 'payment-verify' })
  @Post('mercadopago/verify')
  verifyMercadoPago(@Body() dto: VerifyMercadoPagoDto) {
    return this.verifyPaymentUseCase.execute(dto.paymentId);
  }

  @Public()
  @Post('simulate')
  simulatePayment(
    @CurrentUser() user: JwtPayload | undefined,
    @Body() body: { orderId: string; guestCheckoutToken?: string },
  ) {
    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }
    return this.simulatePaymentUseCase.execute(body.orderId, user?.sub, body.guestCheckoutToken);
  }

  @Public()
  @RateLimit({ limit: 60, ttl: 60, policy: 'webhook' })
  @Post('mercadopago/webhook')
  mercadoPagoWebhook(
    @Body() body: MercadoPagoWebhookBodyDto,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
    @Query('data.id') dataIdQuery?: string,
  ) {
    return this.webhookUseCase.execute(body, { xSignature, xRequestId, dataIdQuery });
  }
}
