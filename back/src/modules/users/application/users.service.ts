import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { UpsertAddressDto } from '../infrastructure/http/dto/upsert-address.dto';
import { UpdateProfileDto } from '../infrastructure/http/dto/update-profile.dto';
import { ChangePasswordDto } from '../infrastructure/http/dto/change-password.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private normalizePagination(page?: number, limit?: number) {
    const normalizedPage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
    const normalizedLimit =
      Number.isFinite(limit) && limit && limit > 0
        ? Math.min(Math.floor(limit), MAX_LIMIT)
        : DEFAULT_LIMIT;
    const skip = (normalizedPage - 1) * normalizedLimit;
    return { page: normalizedPage, limit: normalizedLimit, skip };
  }

  private buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private mapFavorite(fav: {
    product: { id: string; slug: string; title: string; price: number; ProductImage: { url: string }[] };
  }) {
    return {
      productId: fav.product.id,
      slug: fav.product.slug,
      title: fav.product.title,
      price: fav.product.price,
      image: fav.product.ProductImage[0]?.url ?? '',
    };
  }

  private async validateCountry(countryId: string) {
    const country = await this.prisma.country.findUnique({ where: { id: countryId } });
    if (!country) throw new NotFoundException('Country not found');
  }

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
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

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone && dto.phone.trim().length > 0 ? dto.phone : null,
        image: dto.image && dto.image.trim().length > 0 ? dto.image : null,
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

  async changeMyPassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const matches = bcryptjs.compareSync(dto.currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is invalid');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: bcryptjs.hashSync(dto.newPassword, 10) },
    });

    return { ok: true };
  }

  async getMyAddress(userId: string) {
    return this.prisma.userAddress.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
      include: { country: true },
    });
  }

  async listMyAddresses(userId: string, page?: number, limit?: number) {
    const pagination = this.normalizePagination(page, limit);
    const [total, addresses] = await Promise.all([
      this.prisma.userAddress.count({ where: { userId } }),
      this.prisma.userAddress.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: { country: true },
      }),
    ]);

    return {
      data: addresses,
      meta: this.buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async createMyAddress(userId: string, dto: UpsertAddressDto) {
    await this.validateCountry(dto.countryId);

    return this.prisma.userAddress.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        address: dto.address,
        address2: dto.address2,
        postalCode: dto.postalCode,
        city: dto.city,
        phone: dto.phone,
        countryId: dto.countryId,
      },
      include: { country: true },
    });
  }

  async updateMyAddress(userId: string, addressId: string, dto: UpsertAddressDto) {
    await this.validateCountry(dto.countryId);

    const existing = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Address not found');

    return this.prisma.userAddress.update({
      where: { id: existing.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        address: dto.address,
        address2: dto.address2,
        postalCode: dto.postalCode,
        city: dto.city,
        phone: dto.phone,
        countryId: dto.countryId,
      },
      include: { country: true },
    });
  }

  async deleteMyAddressById(userId: string, addressId: string) {
    const result = await this.prisma.userAddress.deleteMany({
      where: { id: addressId, userId },
    });
    if (result.count === 0) throw new NotFoundException('Address not found');
    return { ok: true };
  }

  async upsertMyAddress(userId: string, dto: UpsertAddressDto) {
    await this.validateCountry(dto.countryId);

    const existing = await this.prisma.userAddress.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.userAddress.update({
        where: { id: existing.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          address: dto.address,
          address2: dto.address2,
          postalCode: dto.postalCode,
          city: dto.city,
          phone: dto.phone,
          countryId: dto.countryId,
        },
        include: { country: true },
      });
    }

    return this.prisma.userAddress.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        address: dto.address,
        address2: dto.address2,
        postalCode: dto.postalCode,
        city: dto.city,
        phone: dto.phone,
        countryId: dto.countryId,
      },
      include: { country: true },
    });
  }

  async deleteMyAddress(userId: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!address) return { ok: true };

    await this.prisma.userAddress.delete({ where: { id: address.id } });
    return { ok: true };
  }

  async listMyFavorites(userId: string) {
    const favorites = await this.prisma.userFavorite.findMany({
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

    return favorites.map((fav) => this.mapFavorite(fav));
  }

  async listMyFavoritesPaginated(userId: string, page?: number, limit?: number) {
    const pagination = this.normalizePagination(page, limit);
    const [total, favorites] = await Promise.all([
      this.prisma.userFavorite.count({ where: { userId } }),
      this.prisma.userFavorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
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
      }),
    ]);

    return {
      data: favorites.map((fav) => this.mapFavorite(fav)),
      meta: this.buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async addMyFavorite(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.userFavorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return this.listMyFavorites(userId);
  }

  async removeMyFavorite(userId: string, productId: string) {
    await this.prisma.userFavorite.deleteMany({
      where: { userId, productId },
    });
    return { ok: true };
  }
}
