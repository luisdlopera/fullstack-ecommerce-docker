import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  AdminMetricsRepositoryPort,
  DashboardMetricsSnapshot,
  PaidOrderPoint,
  TopProductPoint,
} from '../../domain/ports/admin-metrics.repository.port';

@Injectable()
export class PrismaAdminMetricsRepository implements AdminMetricsRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getDashboardSnapshot(dateFrom: Date): Promise<DashboardMetricsSnapshot> {
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

    return {
      totalSales: totalSales._sum.total ?? 0,
      totalOrders,
      totalUsers,
      activeProducts,
      pendingOrders,
      outOfStock,
      periodRevenue: periodOrders._sum.total ?? 0,
      periodOrders: periodOrders._count ?? 0,
    };
  }

  listPaidOrdersSince(dateFrom: Date): Promise<PaidOrderPoint[]> {
    return this.prisma.order.findMany({
      where: { isPaid: true, createdAt: { gte: dateFrom } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listRecentOrders(limit: number): Promise<unknown[]> {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async listTopProducts(limit: number): Promise<TopProductPoint[]> {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { ProductImage: { take: 1 } },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    return items.map((item) => ({
      product: productMap.get(item.productId) ?? null,
      totalSold: item._sum.quantity ?? 0,
    }));
  }
}
