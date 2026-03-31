import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { InventoryController } from './infrastructure/http/inventory.controller';
import { InventoryService } from './application/inventory.service';
import { INVENTORY_REPOSITORY } from './domain/ports/inventory-repository.port';
import { PrismaInventoryRepository } from './infrastructure/persistence/prisma-inventory.repository';

@Module({
  imports: [SharedModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: PrismaInventoryRepository,
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
