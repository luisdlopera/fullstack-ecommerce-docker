import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/domain/ports/storage.port';
import { StorageConfig } from '../../../../shared/infrastructure/storage/storage.config';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { UploadFile } from './upload-file.type';
import { randomUUID } from 'node:crypto';
import {
  ALLOWED_PRODUCT_IMAGE_MIME_TYPES,
  MIME_TO_EXTENSION,
  normalizeMimeType,
} from './product-image-file-validation.util';
import { InternalError } from '../../../../shared/domain/errors/domain-error';

export type UploadHomeBannerInput = {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
  altText?: string;
  sortOrder?: number;
  file: UploadFile | undefined;
};

@Injectable()
export class UploadHomeBannerUseCase {
  private readonly logger = new Logger(UploadHomeBannerUseCase.name);

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageConfig) private storageConfig: StorageConfig,
  ) {}

  async execute(input: UploadHomeBannerInput) {
    this.validateFile(input.file);

    const mimeType = normalizeMimeType(input.file.mimetype);
    const extension = MIME_TO_EXTENSION[mimeType];
    const key = `home/banners/${randomUUID()}.${extension}`;

    try {
      this.logger.debug(`Uploading home banner image to ${key}`);
      await this.storage.upload({
        key,
        body: input.file.buffer,
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      });
      this.logger.debug(`Banner uploaded successfully to ${key}`);
    } catch (error) {
      this.logger.error(`Failed to upload banner: ${error instanceof Error ? error.message : String(error)}`);
      throw new InternalError('Error al subir la imagen del banner');
    }

    const url = this.storage.getPublicUrl(key);

    // Get max sort order for new banner
    const maxSort = await this.prisma.homeBanner.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.homeBanner.create({
      data: {
        title: input.title,
        subtitle: input.subtitle || null,
        ctaText: input.ctaText || null,
        ctaLink: input.ctaLink || null,
        secondaryText: input.secondaryText || null,
        secondaryLink: input.secondaryLink || null,
        altText: input.altText || null,
        sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
        imageUrl: url,
        storageKey: key,
        storageProvider: this.storageConfig.provider,
        isActive: true,
      },
    });
  }

  private validateFile(file: UploadFile | undefined): asserts file is UploadFile {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo de imagen');
    }

    const mimeType = normalizeMimeType(file.mimetype);
    if (!ALLOWED_PRODUCT_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException('Tipo de archivo no soportado. Use: jpg, jpeg, png, webp');
    }

    if (file.size > this.storageConfig.maxFileSizeBytes) {
      throw new BadRequestException(
        `Archivo excede el tamaño máximo de ${this.storageConfig.maxFileSizeBytes / 1024 / 1024}MB`,
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Archivo vacío no permitido');
    }
  }
}
