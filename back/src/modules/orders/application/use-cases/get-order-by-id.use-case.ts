import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { isAdminRole } from '../../../../shared/infrastructure/auth/permissions';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../../domain/ports/orders-repository.port';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(@Inject(ORDERS_REPOSITORY) private readonly ordersRepository: OrdersRepositoryPort) {}

  async execute(orderId: string, userId: string, role: Role) {
    const order = await this.ordersRepository.findOrderDetailById(orderId);

    if (!order) throw new NotFoundException('Order not found');
    if (!isAdminRole(role) && order.userId !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }
}
