import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_PRODUCT_REPOSITORY, type AdminProductRepositoryPort } from '../../domain/ports/admin-product.repository.port';

@Injectable()
export class UpdateProductStatusUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
  ) {}

  execute(productId: string, isActive: boolean) {
    return this.productRepository.updateStatus(productId, isActive);
  }
}
