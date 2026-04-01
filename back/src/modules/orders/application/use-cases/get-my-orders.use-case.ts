import { Inject, Injectable } from '@nestjs/common';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../../domain/ports/orders-repository.port';

@Injectable()
export class GetMyOrdersUseCase {
  constructor(@Inject(ORDERS_REPOSITORY) private readonly ordersRepository: OrdersRepositoryPort) {}

  execute(userId: string, page = 1, limit = 10) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    return this.ordersRepository.findOrdersForUser(userId, skip, safeLimit);
  }
}
