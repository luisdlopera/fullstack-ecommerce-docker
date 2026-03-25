import { Injectable } from '@nestjs/common';
import { ProductRepositoryPort } from '../../application/ports/product-repository.port';
import { Product } from '../../domain/product';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findFeatured(limit = 8): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      take: limit,
      orderBy: { title: 'asc' },
      include: {
        ProductImage: true
      }
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      price: row.price,
      slug: row.slug,
      images: row.ProductImage.map((img) => img.url)
    }));
  }
}
