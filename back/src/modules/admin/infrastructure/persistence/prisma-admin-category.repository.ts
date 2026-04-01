import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { AdminCategoryRepositoryPort } from '../../domain/ports/admin-category.repository.port';

@Injectable()
export class PrismaAdminCategoryRepository implements AdminCategoryRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(): Promise<unknown[]> {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { Product: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  findById(categoryId: string): Promise<unknown | null> {
    return this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { Product: true, children: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  findBySlug(slug: string): Promise<{ id: string } | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  countProducts(categoryId: string): Promise<number> {
    return this.prisma.product.count({ where: { categoryId } });
  }

  countChildren(categoryId: string): Promise<number> {
    return this.prisma.category.count({ where: { parentId: categoryId } });
  }

  create(input: Record<string, unknown>): Promise<unknown> {
    return this.prisma.category.create({ data: input as Prisma.CategoryCreateInput });
  }

  update(categoryId: string, input: Record<string, unknown>): Promise<unknown> {
    return this.prisma.category.update({
      where: { id: categoryId },
      data: input as Prisma.CategoryUpdateInput,
    });
  }

  async softDelete(categoryId: string): Promise<void> {
    await this.prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
