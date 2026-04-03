import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StockQuantity } from '../../domain/value-objects/stock-quantity.vo';
import { INVENTORY_REPOSITORY, type InventoryRepositoryPort } from '../ports/inventory-repository.port';
import { PRODUCT_REPOSITORY, type ProductRepositoryPort } from '../ports/product-repository.port';
import { WAREHOUSE_REPOSITORY, type WarehouseRepositoryPort } from '../ports/warehouse-repository.port';
import type { InventoryCommand } from '../dto/inventory-command.dto';

@Injectable()
export class ReserveStockUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepositoryPort,
  ) {}

  async execute(command: InventoryCommand) {
    StockQuantity.from(command.quantity);

    const [productExists, warehouseExists] = await Promise.all([
      this.productRepository.existsById(command.productId),
      this.warehouseRepository.existsById(command.warehouseId),
    ]);

    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    if (!warehouseExists) {
      throw new NotFoundException('Warehouse not found');
    }

    return this.inventoryRepository.reserve(command);
  }
}
