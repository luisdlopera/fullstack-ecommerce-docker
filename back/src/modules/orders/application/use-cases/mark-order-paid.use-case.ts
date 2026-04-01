import { Inject, Injectable } from '@nestjs/common';
import { InventoryService } from '../../../inventory/application/inventory.service';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../../domain/ports/orders-repository.port';
import { UpdateOrderPaymentDto } from '../../infrastructure/http/dto/create-order.dto';
import { BadRequestError, NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class MarkOrderPaidUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY) private readonly ordersRepository: OrdersRepositoryPort,
    @Inject(InventoryService) private readonly inventoryService: InventoryService,
  ) {}

  async execute(orderId: string, dto: UpdateOrderPaymentDto) {
    const order = await this.ordersRepository.findOrderBasic(orderId);
    if (!order) throw new NotFoundError('Order not found');

    if (order.isPaid && order.transactionId === dto.transactionId) {
      return order;
    }

    if (order.isPaid && order.transactionId !== dto.transactionId) {
      throw new BadRequestError('Order is already paid with another transaction');
    }

    await this.inventoryService.commitStock(orderId, order.userId ?? `guest_${order.id}`);

    return this.ordersRepository.markOrderPaid(orderId, dto);
  }
}
