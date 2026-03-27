import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type ProductListFilters,
  type ProductListResult,
  type ProductRepositoryPort,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  execute(filters: ProductListFilters): Promise<ProductListResult> {
    return this.productRepository.list(filters);
  }
}
