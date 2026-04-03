import { Inject, Injectable, Logger } from '@nestjs/common';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/domain/ports/storage.port';
import { StorageConfig } from '../../../../shared/infrastructure/storage/storage.config';
import {
  ADMIN_PRODUCT_IMAGE_REPOSITORY,
  type AdminProductImageRepositoryPort,
} from '../../domain/ports/admin-product-image.repository.port';
import { MIME_TO_EXTENSION, normalizeMimeType, validateProductImageFile } from './product-image-file-validation.util';
import { buildProductImageKey } from './build-product-image-key.util';
import type { UploadFile } from './upload-file.type';
import { InternalError, NotFoundError } from '../../../../shared/domain/errors/domain-error';

export type UploadProductImageInput = {
  productId: string;
  file: UploadFile | undefined;
  makePrimary?: boolean;
};

@Injectable()
export class UploadProductImageUseCase {
  private readonly logger = new Logger(UploadProductImageUseCase.name);

  constructor(
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
    @Inject(ADMIN_PRODUCT_IMAGE_REPOSITORY)
    private readonly repository: AdminProductImageRepositoryPort,
    @Inject(StorageConfig)
    private storageConfig: StorageConfig,
  ) {
    if (!this.storageConfig) {
      this.logger.warn('StorageConfig undefined from DI, manually instantiating as fallback.');
      this.storageConfig = new StorageConfig();
    }
  }

  async execute(input: UploadProductImageInput) {
    validateProductImageFile(input.file, this.storageConfig.maxFileSizeBytes);

    const productExists = await this.repository.existsProductById(input.productId);
    if (!productExists) {
      throw new NotFoundError('Product not found');
    }

    const mimeType = normalizeMimeType(input.file.mimetype);
    const extension = MIME_TO_EXTENSION[mimeType];
    const key = buildProductImageKey(input.productId, extension);

    try {
      this.logger.debug(`Uploading image for product ${input.productId} to MinIO with key ${key}`);
      await this.storage.upload({
        key,
        body: input.file.buffer,
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      });
      this.logger.debug(`Image uploaded successfully to key ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to upload product image to MinIO: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalError('Error al subir la imagen al servidor de almacenamiento');
    }

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
