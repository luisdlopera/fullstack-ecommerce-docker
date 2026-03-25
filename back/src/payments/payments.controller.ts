import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/auth/public.decorator';
import { VerifyMercadoPagoDto } from './dto/verify-mercadopago.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago/verify')
  verifyMercadoPago(@Body() dto: VerifyMercadoPagoDto) {
    return this.paymentsService.verifyMercadoPagoPayment(dto.paymentId);
  }

  @Public()
  @Post('mercadopago/webhook')
  mercadoPagoWebhook(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handleWebhook(body);
  }
}
