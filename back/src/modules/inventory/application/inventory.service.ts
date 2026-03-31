import { Inject, Injectable } from '@nestjs/common';
import { ReserveStockByReferenceUseCase } from './use-cases/reserve-stock-by-reference.use-case';
import { ReleaseStockByReferenceUseCase } from './use-cases/release-stock-by-reference.use-case';
import { CommitStockByReferenceUseCase } from './use-cases/commit-stock-by-reference.use-case';
import { GetInventoryByProductUseCase } from './use-cases/get-inventory-by-product.use-case';
import { GetStockMovementsUseCase } from './use-cases/get-stock-movements.use-case';
import { InventoryMovementType } from '../domain/enums/inventory-movement-type.enum';

type ReserveLineItem = {
  productId: string;
  quantity: number;
  size?: string;
  warehouseId?: string;
};

@Injectable()
export class InventoryService {
  constructor(
    @Inject(ReserveStockByReferenceUseCase)
    private readonly reserveStockByReferenceUseCase: ReserveStockByReferenceUseCase,
    @Inject(ReleaseStockByReferenceUseCase)
    private readonly releaseStockByReferenceUseCase: ReleaseStockByReferenceUseCase,
    @Inject(CommitStockByReferenceUseCase)
    private readonly commitStockByReferenceUseCase: CommitStockByReferenceUseCase,
    @Inject(GetInventoryByProductUseCase)
    private readonly getInventoryByProductUseCase: GetInventoryByProductUseCase,
    @Inject(GetStockMovementsUseCase)
    private readonly getStockMovementsUseCase: GetStockMovementsUseCase,
  ) {}

  async reserveStock(items: ReserveLineItem[], orderId: string, userId: string) {
    const defaultWarehouseId = process.env.DEFAULT_WAREHOUSE_ID;

    if (!defaultWarehouseId) {
      throw new Error('DEFAULT_WAREHOUSE_ID is required for order inventory reservations');
    }

    await this.reserveStockByReferenceUseCase.execute(
      items.map((item) => ({
        productId: item.productId,
        warehouseId: item.warehouseId ?? defaultWarehouseId,
        quantity: item.quantity,
      })),
      orderId,
      userId,
    );
  }

  async releaseStock(orderId: string, userId: string) {
    await this.releaseStockByReferenceUseCase.execute(orderId, userId);
  }

  async commitStock(orderId: string, userId: string) {
    await this.commitStockByReferenceUseCase.execute(orderId, userId);
  }

  getByProduct(productId: string) {
    return this.getInventoryByProductUseCase.execute(productId);
  }

  getMovements(
    page: number,
    limit: number,
    productId?: string,
    warehouseId?: string,
    reference?: string,
    type?: InventoryMovementType,
  ) {
    return this.getStockMovementsUseCase.execute({
      page,
      limit,
      productId,
      warehouseId,
      reference,
      type,
    });
  }
}
