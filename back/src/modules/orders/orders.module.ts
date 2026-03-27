import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { OrdersController } from './infrastructure/http/orders.controller';
import { OrdersService } from './application/orders.service';

@Module({
  imports: [SharedModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
