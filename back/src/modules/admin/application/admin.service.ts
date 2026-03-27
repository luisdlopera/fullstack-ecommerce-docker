import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CreateUserDto } from '../infrastructure/http/dto/create-user.dto';
import { UpdateUserDto } from '../infrastructure/http/dto/update-user.dto';
import { UpdateUserRoleDto } from '../infrastructure/http/dto/update-user-role.dto';
import { UpsertProductDto } from '../infrastructure/http/dto/upsert-product.dto';
import { UpsertCategoryDto } from '../infrastructure/http/dto/upsert-category.dto';
import { UpsertCountryDto } from '../infrastructure/http/dto/upsert-country.dto';

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.REFUNDED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────

  async getDashboardSummary(period: string = '30d') {
    const dateFrom = this.resolvePeriodDate(period);

    const [totalSales, totalOrders, totalUsers, activeProducts, pendingOrders, outOfStock, periodOrders] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { isPaid: true },
          _sum: { total: true },
        }),
        this.prisma.order.count(),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.product.count({ where: { isActive: true, deletedAt: null } }),
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.product.count({ where: { inStock: 0, isActive: true, deletedAt: null } }),
        this.prisma.order.aggregate({
          where: { isPaid: true, createdAt: { gte: dateFrom } },
          _sum: { total: true },
          _count: true,
        }),
      ]);

    const revenue = totalSales._sum.total ?? 0;
    const periodRevenue = periodOrders._sum.total ?? 0;
    const periodCount = periodOrders._count ?? 0;
    const avgTicket = totalOrders > 0 ? revenue / totalOrders : 0;

    return {
      totalSales: revenue,
      totalOrders,
      totalUsers,
      activeProducts,
      avgTicket: Math.round(avgTicket * 100) / 100,
      pendingOrders,
      periodRevenue,
      periodOrders: periodCount,
      outOfStock,
    };
  }

  async getSalesChart(period: string = '30d') {
    const dateFrom = this.resolvePeriodDate(period);

    const orders = await this.prisma.order.findMany({
      where: { isPaid: true, createdAt: { gte: dateFrom } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = new Map<string, { revenue: number; count: number }>();
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const entry = grouped.get(key) ?? { revenue: 0, count: 0 };
      entry.revenue += order.total;
      entry.count += 1;
      grouped.set(key, entry);
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.count,
    }));
  }

  async getRecentOrders(limit = 10) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getTopProducts(limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { ProductImage: { take: 1 } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => ({
      product: productMap.get(item.productId),
      totalSold: item._sum.quantity ?? 0,
    }));
  }

  // ─── Users ────────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string, role?: Role, isActive?: boolean) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: search },
      ];
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          phone: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { Order: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: rows,
      meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        image: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        address: { include: { country: true } },
        _count: { select: { Order: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email is already in use');

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: bcryptjs.hashSync(dto.password, 10),
        phone: dto.phone,
        role: dto.role ?? Role.USER,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return user;
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), id: { not: userId } },
      });
      if (existing) throw new ConflictException('Email is already in use');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        isActive: dto.isActive,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, phone: true },
    });
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, actorId: string) {
    if (userId === actorId) {
      throw new BadRequestException('You cannot change your own role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async updateUserStatus(userId: string, isActive: boolean, actorId: string) {
    if (userId === actorId) {
      throw new BadRequestException('You cannot change your own status');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

  async deleteUser(userId: string, actorId: string) {
    if (userId === actorId) {
      throw new BadRequestException('You cannot delete yourself');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }

  // ─── Orders ───────────────────────────────────────────────────────────

  async getOrders(
    page = 1,
    limit = 20,
    search?: string,
    status?: OrderStatus,
    paymentStatus?: PaymentStatus,
    paid?: boolean,
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (paid !== undefined) where.isPaid = paid;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          OrderItem: true,
          OrderAddress: { include: { country: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: rows,
      meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) },
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        OrderItem: {
          include: {
            product: { include: { ProductImage: { take: 1 } } },
          },
        },
        OrderAddress: { include: { country: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from "${order.status}" to "${newStatus}"`);
    }

    if (newStatus === OrderStatus.CANCELLED && !order.isPaid) {
      await this.restoreStock(orderId);
    }

    const data: Record<string, unknown> = { status: newStatus };

    if (newStatus === OrderStatus.PAID) {
      data.isPaid = true;
      data.paidAt = new Date();
      data.paymentStatus = PaymentStatus.PAID;
    }

    if (newStatus === OrderStatus.REFUNDED) {
      data.paymentStatus = PaymentStatus.REFUNDED;
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data,
      include: { OrderItem: true, OrderAddress: true },
    });
  }

  async updatePaymentStatus(orderId: string, newPaymentStatus: PaymentStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const data: Record<string, unknown> = { paymentStatus: newPaymentStatus };

    if (newPaymentStatus === PaymentStatus.PAID) {
      data.isPaid = true;
      data.paidAt = new Date();
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data,
    });
  }

  async updateOrderNotes(orderId: string, internalNotes: string | undefined) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { internalNotes: internalNotes ?? null },
    });
  }

  // ─── Products ─────────────────────────────────────────────────────────

  async getProducts(page = 1, limit = 20, search?: string, categoryId?: string, isActive?: boolean, inStock?: boolean) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { id: search },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (inStock === true) where.inStock = { gt: 0 };
    if (inStock === false) where.inStock = 0;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          ProductImage: { orderBy: { sortOrder: 'asc' }, take: 2 },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: rows,
      meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) },
    };
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        ProductImage: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(dto: UpsertProductDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const existingSlug = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) throw new ConflictException('Slug is already in use');

    if (dto.sku) {
      const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existingSku) throw new ConflictException('SKU is already in use');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: dto.title,
          description: dto.description,
          sku: dto.sku,
          inStock: dto.inStock,
          price: dto.price,
          comparePrice: dto.comparePrice,
          sizes: dto.sizes,
          slug: dto.slug,
          tags: dto.tags,
          gender: dto.gender,
          categoryId: dto.categoryId,
          featured: dto.featured ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      if (dto.images?.length) {
        await tx.productImage.createMany({
          data: dto.images.map((url, index) => ({ productId: product.id, url, sortOrder: index })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { ProductImage: true, category: true },
      });
    });
  }

  async updateProduct(productId: string, dto: UpsertProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!existing) throw new NotFoundException('Product not found');

    if (dto.slug !== existing.slug) {
      const slugTaken = await this.prisma.product.findFirst({
        where: { slug: dto.slug, id: { not: productId } },
      });
      if (slugTaken) throw new ConflictException('Slug is already in use');
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const skuTaken = await this.prisma.product.findFirst({
        where: { sku: dto.sku, id: { not: productId } },
      });
      if (skuTaken) throw new ConflictException('SKU is already in use');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        title: dto.title,
        description: dto.description,
        sku: dto.sku,
        inStock: dto.inStock,
        price: dto.price,
        comparePrice: dto.comparePrice,
        sizes: dto.sizes,
        slug: dto.slug,
        tags: dto.tags,
        gender: dto.gender,
        categoryId: dto.categoryId,
        featured: dto.featured,
        isActive: dto.isActive,
      },
    });

    if (dto.images) {
      await this.prisma.$transaction([
        this.prisma.productImage.deleteMany({ where: { productId } }),
        this.prisma.productImage.createMany({
          data: dto.images.map((url, index) => ({ productId, url, sortOrder: index })),
        }),
      ]);
    }

    return this.prisma.product.findUnique({
      where: { id: productId },
      include: { ProductImage: true, category: true },
    });
  }

  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }

  async updateProductStatus(productId: string, isActive: boolean) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { isActive },
      select: { id: true, title: true, isActive: true },
    });
  }

  async addProductImage(productId: string, imageUrl: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const maxSort = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    return this.prisma.productImage.create({
      data: {
        productId,
        url: imageUrl,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async deleteProductImage(productId: string, imageId: number) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      throw new NotFoundException('Image not found');
    }
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { ok: true };
  }

  // ─── Categories ───────────────────────────────────────────────────────

  async getCategories() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { Product: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { Product: true, children: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async createCategory(dto: UpsertCategoryDto) {
    const existingSlug = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) throw new ConflictException('Category slug is already in use');

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(id: string, dto: UpsertCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.slug !== existing.slug) {
      const slugTaken = await this.prisma.category.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (slugTaken) throw new ConflictException('Category slug is already in use');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async deleteCategory(id: string) {
    const count = await this.prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new BadRequestException('Cannot delete category with associated products');
    }

    const children = await this.prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { ok: true };
  }

  // ─── Countries ────────────────────────────────────────────────────────

  async getCountries() {
    return this.prisma.country.findMany({
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  async createCountry(dto: UpsertCountryDto) {
    const existing = await this.prisma.country.findUnique({ where: { id: dto.id } });
    if (existing) throw new ConflictException('Country ID already exists');

    return this.prisma.country.create({
      data: {
        id: dto.id,
        name: dto.name,
        isoCode: dto.isoCode,
        currency: dto.currency ?? 'USD',
        isActive: dto.isActive ?? true,
        allowsShipping: dto.allowsShipping ?? true,
        allowsPurchase: dto.allowsPurchase ?? true,
        shippingBaseCost: dto.shippingBaseCost ?? 0,
        etaDays: dto.etaDays ?? 7,
        priority: dto.priority ?? 0,
      },
    });
  }

  async updateCountry(id: string, dto: Partial<UpsertCountryDto>) {
    const existing = await this.prisma.country.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Country not found');

    return this.prisma.country.update({
      where: { id },
      data: {
        name: dto.name,
        isoCode: dto.isoCode,
        currency: dto.currency,
        isActive: dto.isActive,
        allowsShipping: dto.allowsShipping,
        allowsPurchase: dto.allowsPurchase,
        shippingBaseCost: dto.shippingBaseCost,
        etaDays: dto.etaDays,
        priority: dto.priority,
      },
    });
  }

  async deleteCountry(id: string) {
    const addressCount = await this.prisma.userAddress.count({ where: { countryId: id } });
    const orderAddressCount = await this.prisma.orderAddress.count({ where: { countryId: id } });

    if (addressCount > 0 || orderAddressCount > 0) {
      throw new BadRequestException('Cannot delete country with associated addresses');
    }

    await this.prisma.country.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Audit ────────────────────────────────────────────────────────────

  async logAction(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata as never,
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private resolvePeriodDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1d':
        return new Date(now.getTime() - 86_400_000);
      case '7d':
        return new Date(now.getTime() - 7 * 86_400_000);
      case '30d':
        return new Date(now.getTime() - 30 * 86_400_000);
      case '12m':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getTime() - 30 * 86_400_000);
    }
  }

  private async restoreStock(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { inStock: { increment: item.quantity } },
      });
    }
  }
}
