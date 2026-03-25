import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

type ProductFilters = {
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeatured(limit = 8) {
    return this.prisma.product.findMany({
      take: limit,
      orderBy: { title: 'asc' },
      include: { ProductImage: true }
    });
  }

  async list(filters: ProductFilters) {
    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 12, 1), 100);
    const skip = (page - 1) * limit;

    const where = {
      title: filters.query
        ? {
            contains: filters.query,
            mode: 'insensitive' as const
          }
        : undefined,
      category: filters.category
        ? {
            name: {
              equals: filters.category,
              mode: 'insensitive' as const
            }
          }
        : undefined,
      gender: filters.gender as 'men' | 'women' | 'kid' | 'unisex' | undefined,
      price: {
        gte: filters.minPrice,
        lte: filters.maxPrice
      },
      inStock: filters.inStock ? { gt: 0 } : undefined
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
        include: { ProductImage: true, category: true }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    };
  }

  async getBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { ProductImage: true, category: true }
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getStockBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true, slug: true, inStock: true }
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }

  getCountries() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' }
    });
  }
}
