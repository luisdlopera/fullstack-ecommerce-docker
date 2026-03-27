import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type CategoryRecord,
  type ProductRepositoryPort,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  execute(): Promise<CategoryRecord[]> {
    return this.productRepository.findAllCategories();
  }
}
