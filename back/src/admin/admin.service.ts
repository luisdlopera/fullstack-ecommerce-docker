import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
import { UpsertCountryDto } from './dto/upsert-country.dto';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.pending]: [OrderStatus.shipped, OrderStatus.cancelled],
  [OrderStatus.shipped]: [OrderStatus.delivered],
  [OrderStatus.delivered]: [],
  [OrderStatus.cancelled]: []
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Users ---

  async getUsers(page = 1, limit = 20, email?: string, role?: 'admin' | 'user') {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      email: email
        ? {
            contains: email,
            mode: 'insensitive' as const
          }
        : undefined,
      role: role ?? undefined
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { email: 'asc' },
        select: { id: true, name: true, email: true, role: true, emailVerified: true }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: rows,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, actorId: string) {
    if (userId === actorId) {
      throw new BadRequestException('You cannot change your own role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  // --- Orders ---

  async getOrders(page = 1, limit = 20, paid?: boolean) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      isPaid: paid ?? undefined
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          OrderItem: true
        }
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      data: rows,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1)
      }
    };
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${newStatus}"`
      );
    }

    if (newStatus === OrderStatus.cancelled && !order.isPaid) {
      const items = await this.prisma.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { inStock: { increment: item.quantity } }
        });
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { OrderItem: true, OrderAddress: true }
    });
  }

  // --- Products ---

  async createProduct(dto: UpsertProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');

      const product = await tx.product.create({
        data: {
          title: dto.title,
          description: dto.description,
          inStock: dto.inStock,
          price: dto.price,
          sizes: dto.sizes,
          slug: dto.slug,
          tags: dto.tags,
          gender: dto.gender,
          categoryId: dto.categoryId
        }
      });

      if (dto.images?.length) {
        await tx.productImage.createMany({
          data: dto.images.map((url) => ({ productId: product.id, url }))
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { ProductImage: true, category: true }
      });
    });
  }

  async updateProduct(productId: string, dto: UpsertProductDto) {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        title: dto.title,
        description: dto.description,
        inStock: dto.inStock,
        price: dto.price,
        sizes: dto.sizes,
        slug: dto.slug,
        tags: dto.tags,
        gender: dto.gender,
        categoryId: dto.categoryId
      }
    });

    if (dto.images) {
      await this.prisma.$transaction([
        this.prisma.productImage.deleteMany({ where: { productId } }),
        this.prisma.productImage.createMany({
          data: dto.images.map((url) => ({ productId, url }))
        })
      ]);
    }

    return this.prisma.product.findUnique({
      where: { id: productId },
      include: { ProductImage: true, category: true }
    });
  }

  async deleteProduct(productId: string) {
    await this.prisma.$transaction([
      this.prisma.productImage.deleteMany({ where: { productId } }),
      this.prisma.orderItem.deleteMany({ where: { productId } }),
      this.prisma.product.delete({ where: { id: productId } })
    ]);
    return { ok: true };
  }

  async addProductImage(productId: string, imageUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.productImage.create({
      data: {
        productId,
        url: imageUrl
      }
    });
  }

  async deleteProductImage(productId: string, imageId: number) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId }
    });
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found');
    }
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { ok: true };
  }

  // --- Categories ---

  getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { Product: true } } }
    });
  }

  async createCategory(dto: UpsertCategoryDto) {
    return this.prisma.category.create({
      data: { name: dto.name }
    });
  }

  async updateCategory(id: string, dto: UpsertCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name }
    });
  }

  async deleteCategory(id: string) {
    const count = await this.prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new BadRequestException('Cannot delete category with products');
    }
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  // --- Countries ---

  getCountries() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  async createCountry(dto: UpsertCountryDto) {
    return this.prisma.country.create({
      data: { id: dto.id, name: dto.name }
    });
  }

  async deleteCountry(id: string) {
    await this.prisma.country.delete({ where: { id } });
    return { ok: true };
  }
}
