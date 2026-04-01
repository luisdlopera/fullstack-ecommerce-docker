import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_PRODUCT_IMAGE_REPOSITORY,
  type AdminProductImageRepositoryPort,
} from '../../domain/ports/admin-product-image.repository.port';
import { BadRequestError, NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class ReorderProductImagesUseCase {
  constructor(
    @Inject(ADMIN_PRODUCT_IMAGE_REPOSITORY)
    private readonly repository: AdminProductImageRepositoryPort,
  ) {}

  async execute(productId: string, imageIdsInOrder: number[]): Promise<{ ok: true }> {
    if (!Array.isArray(imageIdsInOrder) || imageIdsInOrder.length === 0) {
      throw new BadRequestError('imageIds must be a non-empty array');
    }

    const hasDuplicates = new Set(imageIdsInOrder).size !== imageIdsInOrder.length;
    if (hasDuplicates) {
      throw new BadRequestError('imageIds must not contain duplicates');
    }

    const productExists = await this.repository.existsProductById(productId);
    if (!productExists) {
      throw new NotFoundError('Product not found');
    }

    const images = await this.repository.listProductImages(productId);
    if (images.length !== imageIdsInOrder.length) {
      throw new BadRequestError('imageIds must include all product images');
    }

    const imageIdSet = new Set(images.map((image) => image.id));
    for (const imageId of imageIdsInOrder) {
      if (!imageIdSet.has(imageId)) {
        throw new BadRequestError('imageIds contains invalid ids for this product');
      }
    }

    await this.repository.reorderProductImages(productId, imageIdsInOrder);
    return { ok: true };
  }
}
