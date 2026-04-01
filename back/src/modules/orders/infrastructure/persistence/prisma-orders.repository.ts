import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { CreateOrderDto, UpdateOrderPaymentDto } from '../http/dto/create-order.dto';
import type {
  CheckoutProductRow,
  OrderDetailPayload,
  OrderWithItemsAndAddress,
  OrdersRepositoryPort,
  CartValidationResult,
  CartValidationError,
} from '../../domain/ports/orders-repository.port';

@Injectable()
export class PrismaOrdersRepository implements OrdersRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findProductsByIds(ids: string[]): Promise<CheckoutProductRow[]> {
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true, inStock: true, sizes: true },
    });
    return rows;
  }

  async validateCartStock(items: { productId: string; size: string; quantity: number }[]): Promise<CartValidationResult> {
    const errors: CartValidationError[] = [];

    for (const item of items) {
      const inv = await this.prisma.inventory.findFirst({
        where: {
          productId: item.productId,
        },
        select: { availableQuantity: true },
      });

      if (!inv) {
        errors.push({
          productId: item.productId,
          size: item.size,
          requested: item.quantity,
          available: 0,
          message: `Product not found in inventory`,
        });
      } else if (inv.availableQuantity < item.quantity) {
        errors.push({
          productId: item.productId,
          size: item.size,
          requested: item.quantity,
          available: inv.availableQuantity,
          message: `Insufficient stock for product`,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async createOrderWithStockTx(
    userId: string | undefined,
    dto: CreateOrderDto,
    productMap: Map<string, CheckoutProductRow>,
    subTotal: number,
    tax: number,
    total: number,
    itemsInOrder: number,
    guestCheckoutToken?: string,
  ): Promise<OrderWithItemsAndAddress> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {

      const order = await tx.order.create({
        data: {
          userId,
          guestEmail: !userId ? dto.guestEmail : undefined,
          guestCheckoutToken,
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
    if (!this.prisma) {
      throw new Error('PrismaService not injected in PrismaOrdersRepository');
    }

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
