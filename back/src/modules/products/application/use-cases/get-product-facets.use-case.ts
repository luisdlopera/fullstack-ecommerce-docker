import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type ProductFacetsResult,
  type ProductListFilters,
  type ProductRepositoryPort,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class GetProductFacetsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  execute(filters: ProductListFilters): Promise<ProductFacetsResult> {
    return this.productRepository.facets(filters);
  }
}
