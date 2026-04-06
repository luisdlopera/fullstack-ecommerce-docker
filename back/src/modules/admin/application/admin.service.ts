import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { CreateUserDto } from '../infrastructure/http/dto/create-user.dto';
import { UpdateUserDto } from '../infrastructure/http/dto/update-user.dto';
import { UpdateUserRoleDto } from '../infrastructure/http/dto/update-user-role.dto';
import { UpsertProductDto } from '../infrastructure/http/dto/upsert-product.dto';
import { UpsertCategoryDto } from '../infrastructure/http/dto/upsert-category.dto';
import { UpsertCountryDto } from '../infrastructure/http/dto/upsert-country.dto';
import { ADMIN_AUDIT_REPOSITORY, type AdminAuditRepositoryPort } from '../domain/ports/admin-audit.repository.port';
import {
  ADMIN_CATEGORY_REPOSITORY,
  type AdminCategoryRepositoryPort,
} from '../domain/ports/admin-category.repository.port';
import {
  ADMIN_COUNTRY_REPOSITORY,
  type AdminCountryRepositoryPort,
} from '../domain/ports/admin-country.repository.port';
import {
  ADMIN_METRICS_REPOSITORY,
  type AdminMetricsRepositoryPort,
} from '../domain/ports/admin-metrics.repository.port';
import { ADMIN_ORDER_REPOSITORY, type AdminOrderRepositoryPort } from '../domain/ports/admin-order.repository.port';
import {
  ADMIN_PRODUCT_REPOSITORY,
  type AdminProductRepositoryPort,
} from '../domain/ports/admin-product.repository.port';
import { ADMIN_USER_REPOSITORY, type AdminUserRepositoryPort } from '../domain/ports/admin-user.repository.port';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/domain/errors/domain-error';

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
  constructor(
    @Inject(ADMIN_METRICS_REPOSITORY) private readonly metricsRepository: AdminMetricsRepositoryPort,
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
    @Inject(ADMIN_ORDER_REPOSITORY) private readonly orderRepository: AdminOrderRepositoryPort,
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
    @Inject(ADMIN_CATEGORY_REPOSITORY) private readonly categoryRepository: AdminCategoryRepositoryPort,
    @Inject(ADMIN_COUNTRY_REPOSITORY) private readonly countryRepository: AdminCountryRepositoryPort,
    @Inject(ADMIN_AUDIT_REPOSITORY) private readonly auditRepository: AdminAuditRepositoryPort,
  ) {}

  // ─── Dashboard ────────────────────────────────────────────────────────

  async getDashboardSummary(period: string = '30d') {
    const dateFrom = this.resolvePeriodDate(period);

    const snapshot = await this.metricsRepository.getDashboardSnapshot(dateFrom);
    const avgTicket = snapshot.totalOrders > 0 ? snapshot.totalSales / snapshot.totalOrders : 0;

    return {
      totalSales: snapshot.totalSales,
      totalOrders: snapshot.totalOrders,
      totalUsers: snapshot.totalUsers,
      activeProducts: snapshot.activeProducts,
      avgTicket: Math.round(avgTicket * 100) / 100,
      pendingOrders: snapshot.pendingOrders,
      periodRevenue: snapshot.periodRevenue,
      periodOrders: snapshot.periodOrders,
      outOfStock: snapshot.outOfStock,
    };
  }

  async getSalesChart(period: string = '30d') {
    const dateFrom = this.resolvePeriodDate(period);
    const orders = await this.metricsRepository.listPaidOrdersSince(dateFrom);

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
    return this.metricsRepository.listRecentOrders(limit);
  }

  async getTopProducts(limit = 10) {
    return this.metricsRepository.listTopProducts(limit);
  }

  // ─── Users ────────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string, role?: Role, isActive?: boolean, actorRole?: Role) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const { data, total } = await this.userRepository.list({
      page: safePage,
      limit: safeLimit,
      search,
      role,
      isActive,
      actorRole,
    });

    return {
      data,
      meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) },
    };
  }

  async getUserById(userId: string, actorRole?: Role) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (actorRole === Role.SUPPORT && user.role !== Role.CUSTOMER) {
      throw new ForbiddenError('Support can only access customers');
    }

    return user;
  }

  async createUser(dto: CreateUserDto, actorRole?: Role) {
    if (actorRole === Role.ADMIN && dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('ADMIN cannot manage SUPER_ADMIN users');
    }

    const email = dto.email.toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email is already in use');

    return this.userRepository.create({
      name: dto.name,
      email,
      passwordHash: bcryptjs.hashSync(dto.password, 10),
      phone: dto.phone,
      role: dto.role ?? Role.CUSTOMER,
    });
  }

  async updateUser(userId: string, dto: UpdateUserDto, actorRole?: Role) {
    await this.assertCanManageTargetUser(userId, actorRole);

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== userId) throw new ConflictError('Email is already in use');
    }

    return this.userRepository.update(userId, {
      name: dto.name,
      email: dto.email?.toLowerCase(),
      phone: dto.phone,
      isActive: dto.isActive,
    });
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, actorId: string, actorRole: Role) {
    if (userId === actorId) {
      throw new BadRequestError('You cannot change your own role');
    }

    await this.assertCanManageTargetUser(userId, actorRole);

    if (actorRole === Role.ADMIN && dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('ADMIN cannot assign SUPER_ADMIN role');
    }

    const updated = await this.userRepository.updateRole(userId, dto.role);
    if (!updated) throw new NotFoundError('User not found');

    await this.logAction(actorId, 'user.role.changed', 'user', userId, { nextRole: dto.role });

    return updated;
  }

  async updateUserStatus(userId: string, isActive: boolean, actorId: string, actorRole: Role) {
    if (userId === actorId) {
      throw new BadRequestError('You cannot change your own status');
    }

    await this.assertCanManageTargetUser(userId, actorRole);

    return this.userRepository.updateStatus(userId, isActive);
  }

  async deleteUser(userId: string, actorId: string, actorRole: Role) {
    if (userId === actorId) {
      throw new BadRequestError('You cannot delete yourself');
    }

    await this.assertCanManageTargetUser(userId, actorRole);

    await this.userRepository.softDelete(userId);
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
    const { data, total } = await this.orderRepository.list({
      page: safePage,
      limit: safeLimit,
      search,
      status,
      paymentStatus,
      paid,
    });

    return {
      data,
      meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) },
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus, actorId: string) {
    const order = await this.orderRepository.findBasic(orderId);
    if (!order) throw new NotFoundError('Order not found');

    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(`Cannot transition from "${order.status}" to "${newStatus}"`);
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

    const updated = await this.orderRepository.updateStatus(
      orderId,
      data as {
        status: OrderStatus;
        isPaid?: boolean;
        paidAt?: Date;
        paymentStatus?: PaymentStatus;
      },
    );

    await this.logAction(actorId, 'order.status.changed', 'order', orderId, {
      previousStatus: order.status,
      nextStatus: newStatus,
    });

    return updated;
  }

  async updatePaymentStatus(orderId: string, newPaymentStatus: PaymentStatus) {
    const order = await this.orderRepository.findBasic(orderId);
    if (!order) throw new NotFoundError('Order not found');

    const data: Record<string, unknown> = { paymentStatus: newPaymentStatus };

    if (newPaymentStatus === PaymentStatus.PAID) {
      data.isPaid = true;
      data.paidAt = new Date();
    }

    return this.orderRepository.updatePaymentStatus(
      orderId,
      data as {
        paymentStatus: PaymentStatus;
        isPaid?: boolean;
        paidAt?: Date;
      },
    );
  }

  async updateOrderNotes(orderId: string, internalNotes: string | undefined) {
    const order = await this.orderRepository.findBasic(orderId);
    if (!order) throw new NotFoundError('Order not found');

    return this.orderRepository.updateNotes(orderId, internalNotes ?? null);
  }

  // ─── Products ─────────────────────────────────────────────────────────

  async getProducts(page = 1, limit = 20, search?: string, categoryId?: string, isActive?: boolean, inStock?: boolean) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const { data, total } = await this.productRepository.list({
      page: safePage,
      limit: safeLimit,
      search,
      categoryId,
      isActive,
      inStock,
    });

    return {
      data,
      meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) },
    };
  }

  async getProductById(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  async createProduct(dto: UpsertProductDto) {
    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) throw new NotFoundError('Category not found');

    const existingSlug = await this.productRepository.findBySlug(dto.slug);
    if (existingSlug) throw new ConflictError('Slug is already in use');

    if (dto.sku) {
      const existingSku = await this.productRepository.findBySku(dto.sku);
      if (existingSku) throw new ConflictError('SKU is already in use');
    }

    return this.productRepository.create(
      {
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
      dto.images,
    );
  }

  async updateProduct(productId: string, dto: UpsertProductDto) {
    const existing = await this.productRepository.findById(productId);
    if (!existing) throw new NotFoundError('Product not found');
    const existingData = existing as { slug?: string | null; sku?: string | null };

    if (dto.slug !== existingData.slug) {
      const slugTaken = await this.productRepository.findBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== productId) throw new ConflictError('Slug is already in use');
    }

    if (dto.sku && dto.sku !== existingData.sku) {
      const skuTaken = await this.productRepository.findBySku(dto.sku);
      if (skuTaken && skuTaken.id !== productId) throw new ConflictError('SKU is already in use');
    }

    return this.productRepository.update(
      productId,
      {
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
      dto.images,
    );
  }

  async deleteProduct(productId: string, actorId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    const productTitle = (product as { title?: string }).title ?? '';

    await this.productRepository.softDelete(productId);

    await this.logAction(actorId, 'product.deleted', 'product', productId, { title: productTitle });

    return { ok: true };
  }

  async updateProductStatus(productId: string, isActive: boolean) {
    return this.productRepository.updateStatus(productId, isActive);
  }

  async addProductImage(productId: string, imageUrl: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    return this.productRepository.addImage(productId, imageUrl);
  }

  async deleteProductImage(productId: string, imageId: number) {
    const deleted = await this.productRepository.deleteImage(productId, imageId);
    if (!deleted) throw new NotFoundError('Image not found');
    return { ok: true };
  }

  // ─── Categories ───────────────────────────────────────────────────────

  async getCategories() {
    return this.categoryRepository.list();
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  async createCategory(dto: UpsertCategoryDto) {
    const existingSlug = await this.categoryRepository.findBySlug(dto.slug);
    if (existingSlug) throw new ConflictError('Category slug is already in use');

    return this.categoryRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      image: dto.image,
      parentId: dto.parentId,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async updateCategory(id: string, dto: UpsertCategoryDto) {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category not found');
    const existingData = existing as { slug?: string | null };

    if (dto.slug !== existingData.slug) {
      const slugTaken = await this.categoryRepository.findBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== id) throw new ConflictError('Category slug is already in use');
    }

    return this.categoryRepository.update(id, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      image: dto.image,
      parentId: dto.parentId,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    });
  }

  async deleteCategory(id: string) {
    const count = await this.categoryRepository.countProducts(id);
    if (count > 0) {
      throw new BadRequestError('Cannot delete category with associated products');
    }

    const children = await this.categoryRepository.countChildren(id);
    if (children > 0) {
      throw new BadRequestError('Cannot delete category with subcategories');
    }

    await this.categoryRepository.softDelete(id);
    return { ok: true };
  }

  // ─── Countries ────────────────────────────────────────────────────────

  async getCountries() {
    return this.countryRepository.list();
  }

  async createCountry(dto: UpsertCountryDto) {
    const existing = await this.countryRepository.findById(dto.id);
    if (existing) throw new ConflictError('Country ID already exists');

    return this.countryRepository.create({
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
    });
  }

  async updateCountry(id: string, dto: Partial<UpsertCountryDto>) {
    const existing = await this.countryRepository.findById(id);
    if (!existing) throw new NotFoundError('Country not found');

    return this.countryRepository.update(id, {
      name: dto.name,
      isoCode: dto.isoCode,
      currency: dto.currency,
      isActive: dto.isActive,
      allowsShipping: dto.allowsShipping,
      allowsPurchase: dto.allowsPurchase,
      shippingBaseCost: dto.shippingBaseCost,
      etaDays: dto.etaDays,
      priority: dto.priority,
    });
  }

  async deleteCountry(id: string) {
    const addressCount = await this.countryRepository.countUserAddresses(id);
    const orderAddressCount = await this.countryRepository.countOrderAddresses(id);

    if (addressCount > 0 || orderAddressCount > 0) {
      throw new BadRequestError('Cannot delete country with associated addresses');
    }

    await this.countryRepository.delete(id);
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
    await this.auditRepository.create({
      actorId,
      action,
      entityType,
      entityId,
      metadata,
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
    const items = await this.orderRepository.listOrderItems(orderId);
    for (const item of items) {
      await this.productRepository.incrementStock(item.productId, item.quantity);
    }
  }

  private async assertCanManageTargetUser(targetUserId: string, actorRole?: Role) {
    if (!actorRole) return;
    if (actorRole === Role.SUPER_ADMIN) return;

    const target = await this.userRepository.findByIdWithRole(targetUserId);

    if (!target) {
      throw new NotFoundError('User not found');
    }

    if (actorRole === Role.ADMIN && target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('ADMIN cannot manage SUPER_ADMIN users');
    }
  }
}
