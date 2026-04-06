import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  AdminProductListFilters,
  AdminProductRepositoryPort,
} from '../../domain/ports/admin-product.repository.port';

@Injectable()
export class PrismaAdminProductRepository implements AdminProductRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(filters: AdminProductListFilters): Promise<{ data: unknown[]; total: number }> {
    const { page, limit, search, categoryId, isActive, inStock } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { id: search },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (inStock === true) where.inStock = { gt: 0 };
    if (inStock === false) where.inStock = 0;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ProductImage: { orderBy: { sortOrder: 'asc' }, take: 2 },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: rows, total };
  }

  findById(productId: string): Promise<unknown | null> {
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: { ProductImage: { orderBy: { sortOrder: 'asc' } }, category: true },
    });
  }

  findBySlug(slug: string): Promise<{ id: string } | null> {
    return this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  findBySku(sku: string): Promise<{ id: string } | null> {
    return this.prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });
  }

  async create(input: Record<string, unknown>, images?: string[]): Promise<unknown> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: input as Prisma.ProductCreateInput });

      if (images?.length) {
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            productId: product.id,
            url,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }

      // Create inventory record in default warehouse
      const defaultWarehouseId = process.env.DEFAULT_WAREHOUSE_ID;
      if (defaultWarehouseId) {
        await tx.inventory.create({
          data: {
            productId: product.id,
            warehouseId: defaultWarehouseId,
            availableQuantity: (input.inStock as number) || 0,
          },
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { ProductImage: true, category: true },
      });
    });
  }

  async update(productId: string, input: Record<string, unknown>, images?: string[]): Promise<unknown> {
    await this.prisma.product.update({
      where: { id: productId },
      data: input as Prisma.ProductUpdateInput,
    });

    if (images) {
      await this.prisma.$transaction([
        this.prisma.productImage.deleteMany({ where: { productId } }),
        this.prisma.productImage.createMany({
          data: images.map((url, index) => ({
            productId,
            url,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        }),
      ]);
    }

    return this.prisma.product.findUnique({
      where: { id: productId },
      include: { ProductImage: true, category: true },
    });
  }

  async softDelete(productId: string): Promise<{ id: string; title: string } | null> {
    return this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), isActive: false },
      select: { id: true, title: true },
    });
  }

  updateStatus(productId: string, isActive: boolean): Promise<{ id: string; title: string; isActive: boolean }> {
    return this.prisma.product.update({
      where: { id: productId },
      data: { isActive },
      select: { id: true, title: true, isActive: true },
    });
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: { inStock: { increment: quantity } },
    });
  }

  async addImage(productId: string, imageUrl: string): Promise<unknown> {
    const maxSort = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    const existingCount = await this.prisma.productImage.count({ where: { productId } });

    return this.prisma.productImage.create({
      data: {
        productId,
        url: imageUrl,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        isPrimary: existingCount === 0,
      },
    });
  }

  async deleteImage(productId: string, imageId: number): Promise<boolean> {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      return false;
    }
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return true;
  }
}
