import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { OrdersController } from './infrastructure/http/orders.controller';
import { OrdersService } from './application/orders.service';
import { ORDERS_REPOSITORY } from './domain/ports/orders-repository.port';
import { PrismaOrdersRepository } from './infrastructure/persistence/prisma-orders.repository';

@Module({
  imports: [SharedModule],
  controllers: [OrdersController],
  providers: [OrdersService, { provide: ORDERS_REPOSITORY, useClass: PrismaOrdersRepository }],
  exports: [OrdersService],
})
export class OrdersModule {}
