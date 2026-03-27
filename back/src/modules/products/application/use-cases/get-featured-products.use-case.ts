import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type FeaturedProductRecord,
  type ProductRepositoryPort,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class GetFeaturedProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  execute(limit = 8): Promise<FeaturedProductRecord[]> {
    const parsed = Number.isNaN(Number(limit)) ? 8 : limit;
    return this.productRepository.findFeatured(parsed);
  }
}
