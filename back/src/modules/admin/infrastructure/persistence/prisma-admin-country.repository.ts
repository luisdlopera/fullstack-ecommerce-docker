import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { AdminCountryRepositoryPort } from '../../domain/ports/admin-country.repository.port';

@Injectable()
export class PrismaAdminCountryRepository implements AdminCountryRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  list(): Promise<unknown[]> {
    return this.prisma.country.findMany({
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  findById(countryId: string): Promise<unknown | null> {
    return this.prisma.country.findUnique({ where: { id: countryId } });
  }

  create(input: Record<string, unknown>): Promise<unknown> {
    return this.prisma.country.create({ data: input as Prisma.CountryCreateInput });
  }

  update(countryId: string, input: Record<string, unknown>): Promise<unknown> {
    return this.prisma.country.update({
      where: { id: countryId },
      data: input as Prisma.CountryUpdateInput,
    });
  }

  async delete(countryId: string): Promise<void> {
    await this.prisma.country.delete({ where: { id: countryId } });
  }

  countUserAddresses(countryId: string): Promise<number> {
    return this.prisma.userAddress.count({ where: { countryId } });
  }

  countOrderAddresses(countryId: string): Promise<number> {
    return this.prisma.orderAddress.count({ where: { countryId } });
  }
}
