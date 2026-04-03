import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { OrdersController } from './infrastructure/http/orders.controller';
import { ORDERS_REPOSITORY } from './domain/ports/orders-repository.port';
import { PrismaOrdersRepository } from './infrastructure/persistence/prisma-orders.repository';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { InventoryModule } from '../inventory/inventory.module';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { ValidateCartUseCase } from './application/use-cases/validate-cart.use-case';
import { GetMyOrdersUseCase } from './application/use-cases/get-my-orders.use-case';
import { GetOrderByIdUseCase } from './application/use-cases/get-order-by-id.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { MarkOrderPaidUseCase } from './application/use-cases/mark-order-paid.use-case';

@Module({
  imports: [SharedModule, InventoryModule],
  controllers: [OrdersController],
  providers: [
    {
      provide: ORDERS_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaOrdersRepository(prisma),
      inject: [PrismaService],
    },
    CreateOrderUseCase,
    ValidateCartUseCase,
    GetMyOrdersUseCase,
    GetOrderByIdUseCase,
    UpdateOrderStatusUseCase,
    MarkOrderPaidUseCase,
  ],
  exports: [],
})
export class OrdersModule {}
