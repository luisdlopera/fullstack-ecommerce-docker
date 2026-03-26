import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { UpsertAddressDto } from './dto/upsert-address.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMyAddress(userId: string) {
    return this.prisma.userAddress.findUnique({
      where: { userId },
      include: { country: true }
    });
  }

  async upsertMyAddress(userId: string, dto: UpsertAddressDto) {
    const country = await this.prisma.country.findUnique({
      where: { id: dto.countryId }
    });
    if (!country) throw new NotFoundException('Country not found');

    return this.prisma.userAddress.upsert({
      where: { userId },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        address: dto.address,
        address2: dto.address2,
        postalCode: dto.postalCode,
        city: dto.city,
        phone: dto.phone,
        countryId: dto.countryId
      },
      create: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        address: dto.address,
        address2: dto.address2,
        postalCode: dto.postalCode,
        city: dto.city,
        phone: dto.phone,
        countryId: dto.countryId
      },
      include: { country: true }
    });
  }

  async deleteMyAddress(userId: string) {
    const address = await this.prisma.userAddress.findUnique({
      where: { userId }
    });
    if (!address) return { ok: true };

    await this.prisma.userAddress.delete({ where: { userId } });
    return { ok: true };
  }
}
