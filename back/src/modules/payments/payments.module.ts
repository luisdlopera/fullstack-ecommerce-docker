import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PaymentsController } from './infrastructure/http/payments.controller';
import { PaymentsService } from './application/payments.service';

@Module({
  imports: [SharedModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
