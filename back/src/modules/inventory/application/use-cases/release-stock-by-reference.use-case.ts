import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { INVENTORY_REPOSITORY, type InventoryRepositoryPort } from '../ports/inventory-repository.port';

@Injectable()
export class ReleaseStockByReferenceUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: InventoryRepositoryPort,
  ) {}

  async execute(reference: string, userId?: string): Promise<void> {
    if (!reference.trim()) {
      throw new BadRequestException('Reference is required');
    }

    await this.inventoryRepository.releaseByReference(reference, userId);
  }
}
