import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import type {
  CreateWarehouseInput,
  WarehouseRecord,
  WarehouseRepositoryPort,
} from '../../../application/ports/warehouse-repository.port';

@Injectable()
export class PrismaWarehouseRepository implements WarehouseRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async existsById(warehouseId: string): Promise<boolean> {
    const count = await this.prisma.warehouse.count({
      where: {
        id: warehouseId,
        isActive: true,
      },
    });

    return count > 0;
  }

  create(input: CreateWarehouseInput): Promise<WarehouseRecord> {
    return this.prisma.warehouse.create({
      data: {
        name: input.name,
        code: input.code,
        location: input.location,
      },
    });
  }
}
