import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import type { ProductRepositoryPort } from '../../../application/ports/product-repository.port';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async existsById(productId: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    return count > 0;
  }
}
