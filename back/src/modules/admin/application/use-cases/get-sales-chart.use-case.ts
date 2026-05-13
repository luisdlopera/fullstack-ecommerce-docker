import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_METRICS_REPOSITORY, type AdminMetricsRepositoryPort } from '../../domain/ports/admin-metrics.repository.port';

@Injectable()
export class GetSalesChartUseCase {
  constructor(
    @Inject(ADMIN_METRICS_REPOSITORY) private readonly metricsRepository: AdminMetricsRepositoryPort,
  ) {}

  async execute(period: string = '30d') {
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
