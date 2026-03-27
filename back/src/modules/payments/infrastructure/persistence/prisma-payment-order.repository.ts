import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  MarkOrderPaidAtomicResult,
  OrderPaymentRow,
  PaymentOrderRepositoryPort,
} from '../../domain/ports/payment-order-repository.port';

@Injectable()
export class PrismaPaymentOrderRepository implements PaymentOrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findOrderById(orderId: string): Promise<OrderPaymentRow | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, total: true, isPaid: true, transactionId: true },
    });
    return order;
  }

  async markOrderPaidAtomic(orderId: string, transactionId: string): Promise<MarkOrderPaidAtomicResult> {
    const updated = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        isPaid: false,
      },
      data: {
        isPaid: true,
        paidAt: new Date(),
        transactionId,
        paymentStatus: PaymentStatus.PAID,
      },
    });

    if (updated.count === 1) {
      return { status: 'paid' };
    }

    const current = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { isPaid: true, transactionId: true },
    });

    if (!current) {
      return { status: 'conflict', existingTransactionId: null };
    }

    if (current.isPaid && current.transactionId === transactionId) {
      return { status: 'already_paid', existingTransactionId: current.transactionId };
    }

    return { status: 'conflict', existingTransactionId: current.transactionId };
  }
}
