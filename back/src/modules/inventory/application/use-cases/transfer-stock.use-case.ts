import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StockQuantity } from '../../domain/value-objects/stock-quantity.vo';
import { INVENTORY_REPOSITORY, type InventoryRepositoryPort } from '../ports/inventory-repository.port';
import { LOW_STOCK_NOTIFIER, type LowStockNotifierPort } from '../ports/low-stock-notifier.port';
import { PRODUCT_REPOSITORY, type ProductRepositoryPort } from '../ports/product-repository.port';
import { WAREHOUSE_REPOSITORY, type WarehouseRepositoryPort } from '../ports/warehouse-repository.port';
import type { TransferStockCommand } from '../dto/inventory-command.dto';

@Injectable()
export class TransferStockUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepositoryPort,
    @Inject(LOW_STOCK_NOTIFIER)
    private readonly lowStockNotifier: LowStockNotifierPort,
  ) {}

  async execute(command: TransferStockCommand) {
    StockQuantity.from(command.quantity);

    if (command.sourceWarehouseId === command.targetWarehouseId) {
      throw new BadRequestException('Transfer source and destination warehouses must differ');
    }

    const [productExists, sourceWarehouseExists, targetWarehouseExists] = await Promise.all([
      this.productRepository.existsById(command.productId),
      this.warehouseRepository.existsById(command.sourceWarehouseId),
      this.warehouseRepository.existsById(command.targetWarehouseId),
    ]);

    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    if (!sourceWarehouseExists || !targetWarehouseExists) {
      throw new NotFoundException('Warehouse not found');
    }

    const result = await this.inventoryRepository.transfer(command);

    if (result.source.availableQuantity <= result.source.lowStockThreshold) {
      await this.lowStockNotifier.notify(result.source);
    }

    if (result.target.availableQuantity <= result.target.lowStockThreshold) {
      await this.lowStockNotifier.notify(result.target);
    }

    return result;
  }
}
