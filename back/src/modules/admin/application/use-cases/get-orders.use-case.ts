import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ADMIN_ORDER_REPOSITORY, type AdminOrderRepositoryPort } from '../../domain/ports/admin-order.repository.port';

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject(ADMIN_ORDER_REPOSITORY) private readonly orderRepository: AdminOrderRepositoryPort,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
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
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }
}
