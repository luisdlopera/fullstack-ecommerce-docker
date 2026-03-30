import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/domain/ports/storage.port';
import { StorageConfig } from '../../../../shared/infrastructure/storage/storage.config';
import {
  ADMIN_PRODUCT_IMAGE_REPOSITORY,
  type AdminProductImageRepositoryPort,
} from '../../domain/ports/admin-product-image.repository.port';
import {
  MIME_TO_EXTENSION,
  normalizeMimeType,
  validateProductImageFile,
} from './product-image-file-validation.util';
import { buildProductImageKey } from './build-product-image-key.util';
import type { UploadFile } from './upload-file.type';

export type UploadProductImageInput = {
  productId: string;
  file: UploadFile | undefined;
  makePrimary?: boolean;
};

@Injectable()
export class UploadProductImageUseCase {
  constructor(
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
    @Inject(ADMIN_PRODUCT_IMAGE_REPOSITORY)
    private readonly repository: AdminProductImageRepositoryPort,
    private readonly storageConfig: StorageConfig,
  ) {}

  async execute(input: UploadProductImageInput) {
    validateProductImageFile(input.file, this.storageConfig.maxFileSizeBytes);

    const productExists = await this.repository.existsProductById(input.productId);
    if (!productExists) {
      throw new NotFoundException('Product not found');
    }

    const mimeType = normalizeMimeType(input.file.mimetype);
    const extension = MIME_TO_EXTENSION[mimeType];
    const key = buildProductImageKey(input.productId, extension);

    await this.storage.upload({
      key,
      body: input.file.buffer,
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000, immutable',
    });

    const url = this.storage.getPublicUrl(key);

    return this.repository.createProductImage({
      productId: input.productId,
      url,
      storageProvider: this.storageConfig.provider,
      storageKey: key,
      contentType: mimeType,
      sizeBytes: input.file.size,
      isPrimaryPreferred: input.makePrimary,
    });
  }
}
