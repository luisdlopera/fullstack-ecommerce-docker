import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { CreateOrderDto, UpdateOrderPaymentDto } from '../http/dto/create-order.dto';
import type {
  CheckoutProductRow,
  OrderDetailPayload,
  OrderWithItemsAndAddress,
  OrdersRepositoryPort,
} from '../../domain/ports/orders-repository.port';

@Injectable()
export class PrismaOrdersRepository implements OrdersRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findProductsByIds(ids: string[]): Promise<CheckoutProductRow[]> {
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true, inStock: true, sizes: true },
    });
    return rows;
  }

  async createOrderWithStockTx(
    userId: string,
    dto: CreateOrderDto,
    productMap: Map<string, CheckoutProductRow>,
    subTotal: number,
    tax: number,
    total: number,
    itemsInOrder: number,
  ): Promise<OrderWithItemsAndAddress> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of dto.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, inStock: { gte: item.quantity } },
          data: { inStock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(`Stock changed while processing product: ${item.productId}`);
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          subTotal,
          tax,
          total,
          itemsInOrder,
          status: OrderStatus.PENDING,
          OrderItem: {
            create: dto.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                price: product.price,
              };
            }),
          },
          OrderAddress: {
            create: {
              firstName: dto.address.firstName,
              lastName: dto.address.lastName,
              address: dto.address.address,
              address2: dto.address.address2,
              postalCode: dto.address.postalCode,
              city: dto.address.city,
              phone: dto.address.phone,
              countryId: dto.address.countryId,
            },
          },
        },
        include: {
          OrderItem: true,
          OrderAddress: true,
        },
      });

      return order;
    });
  }

  findOrdersForUser(userId: string, skip: number, take: number): Promise<OrderWithItemsAndAddress[]> {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { OrderItem: true, OrderAddress: true },
    });
  }

  findOrderDetailById(orderId: string): Promise<OrderDetailPayload | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        OrderItem: { include: { product: true } },
        OrderAddress: { include: { country: true } },
      },
    });
  }

  findOrderBasic(orderId: string) {
    return this.prisma.order.findUnique({ where: { id: orderId } });
  }

  updateOrderById(orderId: string, data: { status?: OrderStatus }): Promise<OrderWithItemsAndAddress> {
    return this.prisma.order.update({
      where: { id: orderId },
      data,
      include: { OrderItem: true, OrderAddress: true },
    });
  }

  markOrderPaid(orderId: string, dto: UpdateOrderPaymentDto) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        transactionId: dto.transactionId,
      },
    });
  }

  listOrderItemsForStock(orderId: string) {
    return this.prisma.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });
  }

  async incrementProductStock(productId: string, quantity: number): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: { inStock: { increment: quantity } },
    });
  }
}
