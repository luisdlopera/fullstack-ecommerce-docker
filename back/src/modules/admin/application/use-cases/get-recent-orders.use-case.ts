import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_METRICS_REPOSITORY, type AdminMetricsRepositoryPort } from '../../domain/ports/admin-metrics.repository.port';

@Injectable()
export class GetRecentOrdersUseCase {
  constructor(
    @Inject(ADMIN_METRICS_REPOSITORY) private readonly metricsRepository: AdminMetricsRepositoryPort,
  ) {}

  execute(limit: number = 10) {
    return this.metricsRepository.listRecentOrders(limit);
  }
}
