import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { OrdersController } from './infrastructure/http/orders.controller';
import { OrdersService } from './application/orders.service';
import { ORDERS_REPOSITORY } from './domain/ports/orders-repository.port';
import { PrismaOrdersRepository } from './infrastructure/persistence/prisma-orders.repository';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';

@Module({
  imports: [SharedModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: ORDERS_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaOrdersRepository(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
