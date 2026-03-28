import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { UpsertAddressDto } from '../infrastructure/http/dto/upsert-address.dto';
import { UpdateProfileDto } from '../infrastructure/http/dto/update-profile.dto';
import { ChangePasswordDto } from '../infrastructure/http/dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
    return this.prisma.userAddress.findUnique({
      where: { userId },
      include: { country: true },
    });
  }

  async upsertMyAddress(userId: string, dto: UpsertAddressDto) {
    const country = await this.prisma.country.findUnique({
      where: { id: dto.countryId },
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
        countryId: dto.countryId,
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
        countryId: dto.countryId,
      },
      include: { country: true },
    });
  }

  async deleteMyAddress(userId: string) {
    const address = await this.prisma.userAddress.findUnique({
      where: { userId },
    });
    if (!address) return { ok: true };

    await this.prisma.userAddress.delete({ where: { userId } });
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

    return favorites.map((fav) => ({
      productId: fav.product.id,
      slug: fav.product.slug,
      title: fav.product.title,
      price: fav.product.price,
      image: fav.product.ProductImage[0]?.url ?? '',
    }));
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
