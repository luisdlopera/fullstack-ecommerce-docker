import { Injectable } from '@nestjs/common';
import type {
  AdminProductImageRepositoryPort,
  CreateProductImageInput,
  ProductImageRecord,
} from '../../domain/ports/admin-product-image.repository.port';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaAdminProductImageRepository implements AdminProductImageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async existsProductById(productId: string): Promise<boolean> {
    const row = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    return row != null;
  }

  async createProductImage(input: CreateProductImageInput): Promise<ProductImageRecord> {
    return this.prisma.$transaction(async (tx) => {
      const [count, maxSort] = await Promise.all([
        tx.productImage.count({ where: { productId: input.productId } }),
        tx.productImage.aggregate({
          where: { productId: input.productId },
          _max: { sortOrder: true },
        }),
      ]);

      const shouldBePrimary = input.isPrimaryPreferred === true || count === 0;
      if (shouldBePrimary) {
        await tx.productImage.updateMany({
          where: { productId: input.productId },
          data: { isPrimary: false },
        });
      }

      const created = await tx.productImage.create({
        data: {
          productId: input.productId,
          url: input.url,
          storageProvider: input.storageProvider,
          storageKey: input.storageKey,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          isPrimary: shouldBePrimary,
        },
      });

      return created;
    });
  }

  async findProductImageById(imageId: number): Promise<ProductImageRecord | null> {
    return this.prisma.productImage.findUnique({ where: { id: imageId } });
  }

  async listProductImages(productId: string): Promise<ProductImageRecord[]> {
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async deleteProductImage(imageId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.productImage.delete({ where: { id: imageId } });
      if (!deleted.isPrimary) {
        return;
      }

      const replacement = await tx.productImage.findFirst({
        where: { productId: deleted.productId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });

      if (replacement) {
        await tx.productImage.update({
          where: { id: replacement.id },
          data: { isPrimary: true },
        });
      }
    });
  }

  async reorderProductImages(productId: string, imageIdsInOrder: number[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const images = await tx.productImage.findMany({
        where: { productId },
        select: { id: true },
      });

      if (images.length !== imageIdsInOrder.length) {
        throw new Error('Invalid image order payload');
      }

      const existingIds = new Set(images.map((image) => image.id));
      for (const imageId of imageIdsInOrder) {
        if (!existingIds.has(imageId)) {
          throw new Error('Invalid image order payload');
        }
      }

      await Promise.all(
        imageIdsInOrder.map((imageId, index) =>
          tx.productImage.update({
            where: { id: imageId },
            data: { sortOrder: index },
          }),
        ),
      );
    });
  }

  async setPrimaryImage(productId: string, imageId: number): Promise<ProductImageRecord> {
    return this.prisma.$transaction(async (tx) => {
      const image = await tx.productImage.findUnique({ where: { id: imageId } });
      if (!image || image.productId !== productId) {
        throw new Error('Image not found');
      }

      await tx.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });

      return tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }
}
