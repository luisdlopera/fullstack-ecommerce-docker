import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_METRICS_REPOSITORY, type AdminMetricsRepositoryPort } from '../../domain/ports/admin-metrics.repository.port';

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(ADMIN_METRICS_REPOSITORY) private readonly metricsRepository: AdminMetricsRepositoryPort,
  ) {}

  async execute(period: string = '30d') {
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
}
