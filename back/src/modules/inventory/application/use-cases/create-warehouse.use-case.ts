import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_REPOSITORY, type WarehouseRepositoryPort } from '../ports/warehouse-repository.port';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepositoryPort,
  ) {}

  async execute(input: { name: string; code: string; location?: string }) {
    try {
      return await this.warehouseRepository.create(input);
    } catch {
      throw new ConflictException('Warehouse code already exists');
    }
  }
}
