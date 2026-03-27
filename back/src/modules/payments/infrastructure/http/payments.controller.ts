import { Body, Controller, Headers, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { InitMercadoPagoDto } from './dto/init-mercadopago.dto';
import { VerifyMercadoPagoDto } from './dto/verify-mercadopago.dto';
import { MercadoPagoWebhookBodyDto } from './dto/mercadopago-webhook.dto';
import { PaymentsService } from '../../application/payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago/init')
  initMercadoPagoCheckout(@CurrentUser() user: JwtPayload, @Body() dto: InitMercadoPagoDto) {
    return this.paymentsService.initMercadoPagoCheckout(dto.orderId, user.sub, user.email);
  }

  @Post('mercadopago/verify')
  verifyMercadoPago(@Body() dto: VerifyMercadoPagoDto) {
    return this.paymentsService.verifyMercadoPagoPayment(dto.paymentId);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('mercadopago/webhook')
  mercadoPagoWebhook(
    @Body() body: MercadoPagoWebhookBodyDto,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
    @Query('data.id') dataIdQuery?: string,
  ) {
    return this.paymentsService.handleWebhook(body, { xSignature, xRequestId, dataIdQuery });
  }
}
