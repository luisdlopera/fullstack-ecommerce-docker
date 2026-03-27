import { Injectable } from '@nestjs/common';
import { Prisma, Size } from '@prisma/client';
import type {
  CategoryRecord,
  CountryRecord,
  FeaturedProductRecord,
  ProductListFilters,
  ProductListItem,
  ProductListResult,
  ProductRepositoryPort,
  ProductStockRecord,
} from '../../domain/ports/product-repository.port';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

function parseCsv(v?: string): string[] {
  return v?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
}

function mapUiSizeToPrismaSize(s: string): Size | null {
  const key = s.trim();
  const upper = key.toUpperCase();
  const map: Record<string, Size> = {
    XS: Size.XS,
    S: Size.S,
    M: Size.M,
    L: Size.L,
    XL: Size.XL,
    XXL: Size.XXL,
    XXXL: Size.XXXL,
    '2X': Size.XXL,
  };
  return map[key] ?? map[upper] ?? null;
}

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
  constructor(private readonly prisma: PrismaService) {}

  async findFeatured(limit: number): Promise<FeaturedProductRecord[]> {
    const rows = await this.prisma.product.findMany({
      take: limit,
      orderBy: { title: 'asc' },
      include: { ProductImage: true },
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

    const andParts: Prisma.ProductWhereInput[] = [{ deletedAt: null }, { isActive: true }];

    if (filters.query) {
      andParts.push({
        title: { contains: filters.query, mode: 'insensitive' },
      });
    }

    const mustTag = filters.mustTag ?? filters.tag;
    if (mustTag) {
      andParts.push({ tags: { has: mustTag.toLowerCase() } });
    }

    const anyTagList = parseCsv(filters.anyTags);
    if (anyTagList.length > 0) {
      andParts.push({
        OR: anyTagList.map((t) => ({ tags: { has: t.toLowerCase() } })),
      });
    }

    if (filters.gender) {
      andParts.push({ gender: filters.gender as 'men' | 'women' | 'kid' | 'unisex' });
    }

    const categories = parseCsv(filters.categories);
    if (filters.category) {
      categories.push(filters.category);
    }
    if (categories.length > 0) {
      const uniq = [...new Set(categories)];
      andParts.push({
        OR: uniq.map((name) => ({
          category: { name: { equals: name, mode: 'insensitive' } },
        })),
      });
    }

    const priceFilter: Prisma.FloatFilter = {};
    if (filters.minPrice != null) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice != null) priceFilter.lte = filters.maxPrice;
    if (Object.keys(priceFilter).length > 0) {
      andParts.push({ price: priceFilter });
    }

    if (filters.outOfStockOnly) {
      andParts.push({ inStock: 0 });
    } else if (filters.inStock) {
      andParts.push({ inStock: { gt: 0 } });
    }

    const sizes = parseCsv(filters.sizes);
    const sizeEnums = sizes.map(mapUiSizeToPrismaSize).filter((x): x is Size => x != null);
    if (sizeEnums.length > 0) {
      andParts.push({
        OR: sizeEnums.map((sz) => ({ sizes: { has: sz } })),
      });
    }

    const colors = parseCsv(filters.colors);
    if (colors.length > 0) {
      andParts.push({
        OR: colors.map((c) => ({ tags: { has: `c:${c.toLowerCase()}` } })),
      });
    }

    const colSlugs = parseCsv(filters.colSlugs);
    if (colSlugs.length > 0) {
      andParts.push({
        OR: colSlugs.map((slug) => ({ tags: { has: `col:${slug.toLowerCase()}` } })),
      });
    }

    const classifications = parseCsv(filters.classifications);
    if (classifications.length > 0) {
      andParts.push({
        OR: classifications.map((slug) => ({ tags: { has: `class:${slug.toLowerCase()}` } })),
      });
    }

    const where: Prisma.ProductWhereInput = { AND: andParts };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
        include: { ProductImage: true, category: true },
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

  async findBySlug(slug: string): Promise<ProductListItem | null> {
    const row = await this.prisma.product.findUnique({
      where: { slug },
      include: { ProductImage: true, category: true },
    });
    return row ? mapListItem(row) : null;
  }

  async findStockBySlug(slug: string): Promise<ProductStockRecord | null> {
    const row = await this.prisma.product.findUnique({
      where: { slug },
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
