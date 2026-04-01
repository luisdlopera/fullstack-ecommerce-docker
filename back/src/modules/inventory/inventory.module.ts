import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { InventoryController } from './infrastructure/http/inventory.controller';
import { InventoryService } from './application/inventory.service';
import { INVENTORY_REPOSITORY } from './application/ports/inventory-repository.port';
import { STOCK_MOVEMENT_REPOSITORY } from './application/ports/stock-movement-repository.port';
import { WAREHOUSE_REPOSITORY } from './application/ports/warehouse-repository.port';
import { PRODUCT_REPOSITORY } from './application/ports/product-repository.port';
import { LOW_STOCK_NOTIFIER } from './application/ports/low-stock-notifier.port';
import { PrismaInventoryRepository } from './infrastructure/persistence/prisma/prisma-inventory.repository';
import { PrismaStockMovementRepository } from './infrastructure/persistence/prisma/prisma-stock-movement.repository';
import { PrismaWarehouseRepository } from './infrastructure/persistence/prisma/prisma-warehouse.repository';
import { PrismaProductRepository } from './infrastructure/persistence/prisma/prisma-product.repository';
import { LowStockQueueNotifier } from './infrastructure/queue/low-stock-queue.notifier';
import { LowStockProcessor } from './infrastructure/queue/low-stock.processor';
import { GetInventoryByProductUseCase } from './application/use-cases/get-inventory-by-product.use-case';
import { GetInventoryByWarehouseUseCase } from './application/use-cases/get-inventory-by-warehouse.use-case';
import { IncreaseStockUseCase } from './application/use-cases/increase-stock.use-case';
import { DecreaseStockUseCase } from './application/use-cases/decrease-stock.use-case';
import { AdjustStockUseCase } from './application/use-cases/adjust-stock.use-case';
import { TransferStockUseCase } from './application/use-cases/transfer-stock.use-case';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock.use-case';
import { ReleaseStockUseCase } from './application/use-cases/release-stock.use-case';
import { GetStockMovementsUseCase } from './application/use-cases/get-stock-movements.use-case';
import { ValidateAvailableStockUseCase } from './application/use-cases/validate-available-stock.use-case';
import { CreateWarehouseUseCase } from './application/use-cases/create-warehouse.use-case';
import { ReserveStockByReferenceUseCase } from './application/use-cases/reserve-stock-by-reference.use-case';
import { ReleaseStockByReferenceUseCase } from './application/use-cases/release-stock-by-reference.use-case';
import { CommitStockByReferenceUseCase } from './application/use-cases/commit-stock-by-reference.use-case';

@Module({
  imports: [SharedModule],
  controllers: [InventoryController],
  providers: [
    {
      provide: INVENTORY_REPOSITORY,
      useClass: PrismaInventoryRepository,
    },
    {
      provide: STOCK_MOVEMENT_REPOSITORY,
      useClass: PrismaStockMovementRepository,
    },
    {
      provide: WAREHOUSE_REPOSITORY,
      useClass: PrismaWarehouseRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: LOW_STOCK_NOTIFIER,
      useClass: LowStockQueueNotifier,
    },
    LowStockProcessor,
    InventoryService,
    CreateWarehouseUseCase,
    GetInventoryByProductUseCase,
    GetInventoryByWarehouseUseCase,
    IncreaseStockUseCase,
    DecreaseStockUseCase,
    AdjustStockUseCase,
    TransferStockUseCase,
    ReserveStockUseCase,
    ReleaseStockUseCase,
    GetStockMovementsUseCase,
    ValidateAvailableStockUseCase,
    ReserveStockByReferenceUseCase,
    ReleaseStockByReferenceUseCase,
    CommitStockByReferenceUseCase,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
