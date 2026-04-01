import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY, type InventoryRepositoryPort } from '../ports/inventory-repository.port';

@Injectable()
export class GetInventoryByWarehouseUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
  ) {}

  async execute(warehouseId: string) {
    const rows = await this.inventoryRepository.findByWarehouse(warehouseId);

    if (rows.length === 0) {
      throw new NotFoundException('No inventory found for the requested warehouse');
    }

    return rows;
  }
}
