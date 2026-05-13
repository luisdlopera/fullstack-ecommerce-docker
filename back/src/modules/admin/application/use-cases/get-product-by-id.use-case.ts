import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_PRODUCT_REPOSITORY, type AdminProductRepositoryPort } from '../../domain/ports/admin-product.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
  ) {}

  async execute(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }
}
