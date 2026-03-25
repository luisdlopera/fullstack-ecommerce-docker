import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/product';
import { PRODUCT_REPOSITORY, ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable()
export class GetFeaturedProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort
  ) {}

  execute(limit = 8): Promise<Product[]> {
    return this.productRepository.findFeatured(limit);
  }
}
