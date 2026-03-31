import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
  type ReserveByReferenceItem,
} from '../ports/inventory-repository.port';

@Injectable()
export class ReserveStockByReferenceUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
  ) {}

  async execute(items: ReserveByReferenceItem[], reference: string, userId?: string): Promise<void> {
    if (!reference.trim()) {
      throw new BadRequestException('Reference is required');
    }

    if (items.length === 0) {
      throw new BadRequestException('At least one item is required to reserve stock');
    }

    await this.inventoryRepository.reserveManyByReference(items, reference, userId);
  }
}
