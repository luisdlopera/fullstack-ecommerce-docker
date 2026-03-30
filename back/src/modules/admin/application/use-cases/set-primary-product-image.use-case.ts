import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ADMIN_PRODUCT_IMAGE_REPOSITORY,
  type AdminProductImageRepositoryPort,
} from '../../domain/ports/admin-product-image.repository.port';

@Injectable()
export class SetPrimaryProductImageUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_IMAGE_REPOSITORY)
    private readonly repository: AdminProductImageRepositoryPort,
  ) {}

  async execute(productId: string, imageId: number) {
    const productExists = await this.repository.existsProductById(productId);
    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    const image = await this.repository.findProductImageById(imageId);
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found');
    }

    return this.repository.setPrimaryImage(productId, imageId);
  }
}
