import { Inject, Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { ADMIN_ORDER_REPOSITORY, type AdminOrderRepositoryPort } from '../../domain/ports/admin-order.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class UpdatePaymentStatusUseCase {
  constructor(
    @Inject(ADMIN_ORDER_REPOSITORY) private readonly orderRepository: AdminOrderRepositoryPort,
  ) {}

  async execute(orderId: string, newPaymentStatus: PaymentStatus) {
    const order = await this.orderRepository.findBasic(orderId);
    if (!order) throw new NotFoundError('Order not found');

    const data: Record<string, unknown> = { paymentStatus: newPaymentStatus };

    if (newPaymentStatus === PaymentStatus.PAID) {
      data.isPaid = true;
      data.paidAt = new Date();
    }

    return this.orderRepository.updatePaymentStatus(
      orderId,
      data as {
        paymentStatus: PaymentStatus;
        isPaid?: boolean;
        paidAt?: Date;
      },
    );
  }
}
