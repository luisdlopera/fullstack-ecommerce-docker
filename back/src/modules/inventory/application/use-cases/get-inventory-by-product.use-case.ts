import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INVENTORY_REPOSITORY, type InventoryRepositoryPort } from '../ports/inventory-repository.port';

@Injectable()
export class GetInventoryByProductUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
  ) {}

  async execute(productId: string) {
    const rows = await this.inventoryRepository.findByProduct(productId);

    if (rows.length === 0) {
      throw new NotFoundException('No inventory found for the requested product');
    }

    return rows;
  }
}
