import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY, type InventoryRepositoryPort } from '../ports/inventory-repository.port';

@Injectable()
export class ValidateAvailableStockUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
  ) {}

  async execute(productId: string, warehouseId: string, quantity: number): Promise<{ available: boolean }> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive integer');
    }

    const row = await this.inventoryRepository.findByProductAndWarehouse(productId, warehouseId);
    if (!row) {
      throw new NotFoundException('Inventory record not found');
    }

    const available = await this.inventoryRepository.validateAvailableStock(productId, warehouseId, quantity);
    return { available };
  }
}
