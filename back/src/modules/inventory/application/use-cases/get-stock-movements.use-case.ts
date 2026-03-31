import { Inject, Injectable } from '@nestjs/common';
import {
  STOCK_MOVEMENT_REPOSITORY,
  type StockMovementFilters,
  type StockMovementRepositoryPort,
} from '../ports/stock-movement-repository.port';

@Injectable()
export class GetStockMovementsUseCase {
  constructor(
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepositoryPort,
  ) {}

  execute(filters: StockMovementFilters) {
    const page = Math.max(filters.page, 1);
    const limit = Math.min(Math.max(filters.limit, 1), 100);

    return this.stockMovementRepository.findMany({
      ...filters,
      page,
      limit,
    });
  }
}
