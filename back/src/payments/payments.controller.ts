import { Body, Controller, Post } from '@nestjs/common';
import { VerifyMercadoPagoDto } from './dto/verify-mercadopago.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago/verify')
  verifyMercadoPago(@Body() dto: VerifyMercadoPagoDto) {
    return this.paymentsService.verifyMercadoPagoPayment(dto.paymentId);
  }
}
