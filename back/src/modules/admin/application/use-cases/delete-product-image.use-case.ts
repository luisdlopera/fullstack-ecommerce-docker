import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/domain/ports/storage.port';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';
import {
  ADMIN_PRODUCT_IMAGE_REPOSITORY,
  type AdminProductImageRepositoryPort,
} from '../../domain/ports/admin-product-image.repository.port';

@Injectable()
export class DeleteProductImageUseCase {
  constructor(
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
    @Inject(ADMIN_PRODUCT_IMAGE_REPOSITORY)
    private readonly repository: AdminProductImageRepositoryPort,
  ) {}

  async execute(productId: string, imageId: number): Promise<{ ok: true }> {
    const image = await this.repository.findProductImageById(imageId);
    if (!image || image.productId !== productId) {
      throw new NotFoundError('Image not found');
    }

    if (image.storageKey) {
      await this.storage.delete(image.storageKey);
    }

    await this.repository.deleteProductImage(image.id);
    return { ok: true };
  }
}
