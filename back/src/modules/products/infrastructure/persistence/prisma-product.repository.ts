import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CategoryRecord,
  CountryRecord,
  FeaturedProductRecord,
  ProductFacetsResult,
  ProductListFilters,
  ProductListItem,
  ProductListResult,
  ProductRepositoryPort,
  ProductStockRecord,
} from '../../domain/ports/product-repository.port';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { buildProductListWhere } from './build-product-list-where';

function mapImages(
  imgs: Array<{ id: number; url: string; sortOrder?: number }>,
): ProductListItem['ProductImage'] {
  return imgs.map((img) => ({
    id: img.id,
    url: img.url,
    sortOrder: img.sortOrder,
  }));
}

function mapListItem(
  row: Prisma.ProductGetPayload<{ include: { ProductImage: true; category: true } }>,
): ProductListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    inStock: row.inStock,
    price: row.price,
    comparePrice: row.comparePrice,
    sizes: row.sizes.map((s) => String(s)),
    slug: row.slug,
    tags: row.tags,
    gender: String(row.gender),
    categoryId: row.categoryId,
    ProductImage: mapImages(row.ProductImage),
    category: { id: row.category.id, name: row.category.name },
  };
}

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findFeatured(limit: number): Promise<FeaturedProductRecord[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        featured: true,
        isActive: true,
        deletedAt: null,
      },
      take: limit,
      orderBy: { title: 'asc' },
      include: {
        ProductImage: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      price: row.price,
      slug: row.slug,
      gender: String(row.gender),
      tags: row.tags,
      ProductImage: mapImages(row.ProductImage),
    }));
  }

  async list(filters: ProductListFilters): Promise<ProductListResult> {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 12, 1), 100);
    const skip = (page - 1) * limit;

    const where = buildProductListWhere(filters);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
        include: {
          ProductImage: { orderBy: { sortOrder: 'asc' } },
          category: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: rows.map(mapListItem),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async facets(filters: ProductListFilters): Promise<ProductFacetsResult> {
    const baseWhere = buildProductListWhere(filters);

    const [inStockCount, outOfStockCount, categoryRows] = await this.prisma.$transaction([
      this.prisma.product.count({
        where: { AND: [baseWhere, { inStock: { gt: 0 } }] },
      }),
      this.prisma.product.count({
        where: { AND: [baseWhere, { inStock: 0 }] },
      }),
      this.prisma.product.findMany({
        where: baseWhere,
        distinct: ['categoryId'],
        select: { category: { select: { name: true } } },
      }),
    ]);

    const categoryNames = [...new Set(categoryRows.map((r) => r.category.name))].sort((a, b) =>
      a.localeCompare(b),
    );

    return { inStockCount, outOfStockCount, categoryNames };
  }

  async findBySlug(slug: string): Promise<ProductListItem | null> {
    const row = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: {
        ProductImage: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
    return row ? mapListItem(row) : null;
  }

  async findStockBySlug(slug: string): Promise<ProductStockRecord | null> {
    const row = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      select: { id: true, slug: true, inStock: true },
    });
    return row;
  }

  async findAllCategories(): Promise<CategoryRecord[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((c) => ({ id: c.id, name: c.name }));
  }

  async findAllCountries(): Promise<CountryRecord[]> {
    const rows = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      isoCode: c.isoCode,
      currency: c.currency,
      isActive: c.isActive,
      allowsShipping: c.allowsShipping,
      allowsPurchase: c.allowsPurchase,
    }));
  }
}
