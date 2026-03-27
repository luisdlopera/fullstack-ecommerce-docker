import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
  type ProductStockRecord,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class GetProductStockBySlugUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(slug: string): Promise<ProductStockRecord> {
    const row = await this.productRepository.findStockBySlug(slug);
    if (!row) {
      throw new NotFoundException('Product not found');
    }
    return row;
  }
}
