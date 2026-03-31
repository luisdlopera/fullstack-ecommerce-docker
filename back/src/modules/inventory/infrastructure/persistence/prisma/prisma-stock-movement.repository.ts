import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { InventoryMovementType } from '../../../domain/enums/inventory-movement-type.enum';
import type {
  StockMovementFilters,
  StockMovementRecord,
  StockMovementRepositoryPort,
} from '../../../application/ports/stock-movement-repository.port';

@Injectable()
export class PrismaStockMovementRepository implements StockMovementRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(filters: StockMovementFilters): Promise<{ data: StockMovementRecord[]; total: number }> {
    const where: Prisma.StockMovementWhereInput = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.reference) {
      where.reference = filters.reference;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: data.map((row) => ({
        ...row,
        type: row.type as InventoryMovementType,
      })),
      total,
    };
  }
}
