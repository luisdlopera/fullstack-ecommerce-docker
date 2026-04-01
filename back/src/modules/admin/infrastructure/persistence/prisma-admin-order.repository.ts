import { Inject, Injectable } from '@nestjs/common';
import type { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { AdminOrderListFilters, AdminOrderRepositoryPort } from '../../domain/ports/admin-order.repository.port';

@Injectable()
export class PrismaAdminOrderRepository implements AdminOrderRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(filters: AdminOrderListFilters): Promise<{ data: unknown[]; total: number }> {
    const { page, limit, search, status, paymentStatus, paid } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (paid !== undefined) where.isPaid = paid;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          OrderItem: true,
          OrderAddress: { include: { country: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: rows, total };
  }

  findById(orderId: string): Promise<unknown | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        OrderItem: { include: { product: { include: { ProductImage: { take: 1 } } } } },
        OrderAddress: { include: { country: true } },
      },
    });
  }

  findBasic(orderId: string): Promise<{ id: string; status: OrderStatus; isPaid: boolean } | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, isPaid: true },
    });
  }

  updateStatus(
    orderId: string,
    data: { status: OrderStatus; isPaid?: boolean; paidAt?: Date; paymentStatus?: PaymentStatus },
  ): Promise<unknown> {
    return this.prisma.order.update({
      where: { id: orderId },
      data,
      include: { OrderItem: true, OrderAddress: true },
    });
  }

  updatePaymentStatus(
    orderId: string,
    data: { paymentStatus: PaymentStatus; isPaid?: boolean; paidAt?: Date },
  ): Promise<unknown> {
    return this.prisma.order.update({
      where: { id: orderId },
      data,
    });
  }

  updateNotes(orderId: string, internalNotes: string | null): Promise<unknown> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { internalNotes },
    });
  }

  async listOrderItems(orderId: string): Promise<Array<{ productId: string; quantity: number }>> {
    return this.prisma.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });
  }
}
