import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus, type Role } from '@prisma/client';
import { isAdminRole } from '../../../../shared/infrastructure/auth/permissions';
import { InventoryService } from '../../../inventory/application/inventory.service';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../../domain/ports/orders-repository.port';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../../shared/domain/errors/domain-error';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.REFUNDED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY) private readonly ordersRepository: OrdersRepositoryPort,
    @Inject(InventoryService) private readonly inventoryService: InventoryService,
  ) {}

  async execute(orderId: string, newStatus: OrderStatus, userId: string, role: Role) {
    const order = await this.ordersRepository.findOrderBasic(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (newStatus === OrderStatus.CANCELLED) {
      if (!isAdminRole(role) && order.userId !== userId) {
        throw new ForbiddenError('You cannot cancel this order');
      }
    } else if (!isAdminRole(role)) {
      throw new ForbiddenError('Only admins can update order status');
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestError(`Cannot transition from "${order.status}" to "${newStatus}"`);
    }

    if (newStatus === OrderStatus.CANCELLED && !order.isPaid) {
      await this.inventoryService.releaseStock(orderId, userId);
    }

    if (newStatus === OrderStatus.PAID) {
      await this.inventoryService.commitStock(orderId, userId);
    }

    return this.ordersRepository.updateOrderById(orderId, { status: newStatus });
  }
}
