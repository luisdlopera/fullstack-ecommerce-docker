import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  AddressInput,
  CountryRecord,
  UserAddressRecord,
  UserFavoriteRow,
  UserPasswordRecord,
  UserProfileRecord,
  UsersRepositoryPort,
} from '../../domain/ports/users-repository.port';

@Injectable()
export class PrismaUsersRepository implements UsersRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findUserProfile(userId: string): Promise<UserProfileRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
      },
    });
  }

  updateUserProfile(userId: string, data: Partial<UserProfileRecord>): Promise<UserProfileRecord> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone ?? null,
        image: data.image ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
      },
    });
  }

  findUserPassword(userId: string): Promise<UserPasswordRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }

  findCountryById(countryId: string): Promise<CountryRecord | null> {
    return this.prisma.country.findUnique({ where: { id: countryId } });
  }

  findLatestAddress(userId: string): Promise<UserAddressRecord | null> {
    return this.prisma.userAddress.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
      include: { country: true },
    });
  }

  countAddresses(userId: string): Promise<number> {
    return this.prisma.userAddress.count({ where: { userId } });
  }

  listAddresses(userId: string, skip: number, take: number): Promise<UserAddressRecord[]> {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      skip,
      take,
      include: { country: true },
    });
  }

  createAddress(userId: string, input: AddressInput): Promise<UserAddressRecord> {
    return this.prisma.userAddress.create({
      data: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        address: input.address,
        address2: input.address2 ?? null,
        postalCode: input.postalCode,
        city: input.city,
        phone: input.phone ?? null,
        countryId: input.countryId,
      },
      include: { country: true },
    });
  }

  findAddressById(userId: string, addressId: string): Promise<{ id: string } | null> {
    return this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
  }

  updateAddress(addressId: string, input: AddressInput): Promise<UserAddressRecord> {
    return this.prisma.userAddress.update({
      where: { id: addressId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        address: input.address,
        address2: input.address2 ?? null,
        postalCode: input.postalCode,
        city: input.city,
        phone: input.phone ?? null,
        countryId: input.countryId,
      },
      include: { country: true },
    });
  }

  async deleteAddressById(userId: string, addressId: string): Promise<number> {
    const result = await this.prisma.userAddress.deleteMany({
      where: { id: addressId, userId },
    });
    return result.count;
  }

  async deleteAddress(addressId: string): Promise<void> {
    await this.prisma.userAddress.delete({ where: { id: addressId } });
  }

  listFavorites(userId: string): Promise<UserFavoriteRow[]> {
    return this.prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            ProductImage: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
  }

  countFavorites(userId: string): Promise<number> {
    return this.prisma.userFavorite.count({ where: { userId } });
  }

  listFavoritesPaginated(userId: string, skip: number, take: number): Promise<UserFavoriteRow[]> {
    return this.prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            ProductImage: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
  }

  findActiveProductById(productId: string): Promise<{ id: string } | null> {
    return this.prisma.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
      select: { id: true },
    });
  }

  async upsertFavorite(userId: string, productId: string): Promise<void> {
    await this.prisma.userFavorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
  }

  async deleteFavorite(userId: string, productId: string): Promise<void> {
    await this.prisma.userFavorite.deleteMany({
      where: { userId, productId },
    });
  }
}
