import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ADMIN_ORDER_REPOSITORY, type AdminOrderRepositoryPort } from '../../domain/ports/admin-order.repository.port';
import { ADMIN_PRODUCT_REPOSITORY, type AdminProductRepositoryPort } from '../../domain/ports/admin-product.repository.port';
import { ADMIN_AUDIT_REPOSITORY, type AdminAuditRepositoryPort } from '../../domain/ports/admin-audit.repository.port';
import { NotFoundError, BadRequestError } from '../../../../shared/domain/errors/domain-error';

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
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ADMIN_ORDER_REPOSITORY) private readonly orderRepository: AdminOrderRepositoryPort,
    @Inject(ADMIN_PRODUCT_REPOSITORY) private readonly productRepository: AdminProductRepositoryPort,
    @Inject(ADMIN_AUDIT_REPOSITORY) private readonly auditRepository: AdminAuditRepositoryPort,
  ) {}

  async execute(orderId: string, newStatus: OrderStatus, actorId: string) {
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

    await this.auditRepository.create({
      actorId,
      action: 'order.status.changed',
      entityType: 'order',
      entityId: orderId,
      metadata: {
        previousStatus: order.status,
        nextStatus: newStatus,
      },
    });

    return updated;
  }

  private async restoreStock(orderId: string) {
    const items = await this.orderRepository.listOrderItems(orderId);
    for (const item of items) {
      await this.productRepository.incrementStock(item.productId, item.quantity);
    }
  }
}
