import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreateOrderDto, UpdateOrderPaymentDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, inStock: true, sizes: true }
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products do not exist');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    let itemsInOrder = 0;
    let subTotal = 0;
    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`Product not found: ${item.productId}`);
      if (!product.sizes.includes(item.size)) {
        throw new BadRequestException(`Selected size is not available for product: ${item.productId}`);
      }
      if (product.inStock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${item.productId}`);
      }
      itemsInOrder += item.quantity;
      subTotal += product.price * item.quantity;
    }

    const taxRate = Number(process.env.TAX_RATE ?? 0.15);
    const tax = Number((subTotal * taxRate).toFixed(2));
    const total = Number((subTotal + tax).toFixed(2));

    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, inStock: { gte: item.quantity } },
          data: { inStock: { decrement: item.quantity } }
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
          OrderItem: {
            create: dto.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                size: item.size,
                price: product.price
              };
            })
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
              countryId: dto.address.countryId
            }
          }
        },
        include: {
          OrderItem: true,
          OrderAddress: true
        }
      });

      return order;
    });
  }

  getMyOrders(userId: string, page = 1, limit = 10) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
      include: { OrderItem: true, OrderAddress: true }
    });
  }

  async getById(orderId: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        OrderItem: { include: { product: true } },
        OrderAddress: { include: { country: true } }
      }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (role !== Role.admin && order.userId !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }

  async markAsPaid(orderId: string, dto: UpdateOrderPaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.isPaid && order.transactionId === dto.transactionId) {
      return order;
    }

    if (order.isPaid && order.transactionId !== dto.transactionId) {
      throw new BadRequestException('Order is already paid with another transaction');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        transactionId: dto.transactionId
      }
    });
  }
}
