import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_ORDER_REPOSITORY, type AdminOrderRepositoryPort } from '../../domain/ports/admin-order.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class UpdateOrderNotesUseCase {
  constructor(
    @Inject(ADMIN_ORDER_REPOSITORY) private readonly orderRepository: AdminOrderRepositoryPort,
  ) {}

  async execute(orderId: string, internalNotes?: string) {
    const order = await this.orderRepository.findBasic(orderId);
    if (!order) throw new NotFoundError('Order not found');

    return this.orderRepository.updateNotes(orderId, internalNotes ?? null);
  }
}
