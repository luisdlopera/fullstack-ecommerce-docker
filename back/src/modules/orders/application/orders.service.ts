import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { CreateOrderDto, UpdateOrderPaymentDto } from '../infrastructure/http/dto/create-order.dto';
import { isAdminRole } from '../../../shared/infrastructure/auth/permissions';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../domain/ports/orders-repository.port';
import { InventoryService } from '../../inventory/application/inventory.service';

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
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY) private readonly ordersRepository: OrdersRepositoryPort,
    @Inject(InventoryService) private readonly inventoryService: InventoryService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.ordersRepository.findProductsByIds(productIds);

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
      itemsInOrder += item.quantity;
      subTotal += product.price * item.quantity;
    }

    const taxRate = Number(process.env.TAX_RATE ?? 0.15);
    const tax = Number((subTotal * taxRate).toFixed(2));
    const total = Number((subTotal + tax).toFixed(2));

    // Reserve inventory BEFORE creating order (atomic)
    await this.inventoryService.reserveStock(
      dto.items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      })),
      'pending-order', // temporary ref, will be updated
      userId,
    );

    try {
      const order = await this.ordersRepository.createOrderWithStockTx(
        userId,
        dto,
        productMap,
        subTotal,
        tax,
        total,
        itemsInOrder,
      );

      return order;
    } catch (error) {
      // If order creation fails, release the reserved stock
      await this.inventoryService.releaseStock('pending-order', userId).catch(() => {
        // Log but don't re-throw
      });
      throw error;
    }
  }

  getMyOrders(userId: string, page = 1, limit = 10) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    return this.ordersRepository.findOrdersForUser(userId, skip, safeLimit);
  }

  async getById(orderId: string, userId: string, role: Role) {
    const order = await this.ordersRepository.findOrderDetailById(orderId);

    if (!order) throw new NotFoundException('Order not found');
    if (!isAdminRole(role) && order.userId !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }

  async updateStatus(orderId: string, newStatus: OrderStatus, userId: string, role: Role) {
    const order = await this.ordersRepository.findOrderBasic(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (newStatus === OrderStatus.CANCELLED) {
      if (!isAdminRole(role) && order.userId !== userId) {
        throw new ForbiddenException('You cannot cancel this order');
      }
    } else if (!isAdminRole(role)) {
      throw new ForbiddenException('Only admins can update order status');
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from "${order.status}" to "${newStatus}"`);
    }

    // Handle inventory based on status transition
    if (newStatus === OrderStatus.CANCELLED && !order.isPaid) {
      // Release reserved stock
      await this.inventoryService.releaseStock(orderId, userId);
      // Also restore the old inStock field for backward compatibility
      await this.restoreStock(orderId);
    }

    if (newStatus === OrderStatus.PAID) {
      // Commit reserved stock (reserve -> committed)
      await this.inventoryService.commitStock(orderId, userId);
    }

    return this.ordersRepository.updateOrderById(orderId, { status: newStatus });
  }

  async markAsPaid(orderId: string, dto: UpdateOrderPaymentDto) {
    const order = await this.ordersRepository.findOrderBasic(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (order.isPaid && order.transactionId === dto.transactionId) {
      return order;
    }

    if (order.isPaid && order.transactionId !== dto.transactionId) {
      throw new BadRequestException('Order is already paid with another transaction');
    }

    // Commit inventory when payment is confirmed
    await this.inventoryService.commitStock(orderId, order.userId);

    return this.ordersRepository.markOrderPaid(orderId, dto);
  }

  private async restoreStock(orderId: string) {
    const items = await this.ordersRepository.listOrderItemsForStock(orderId);

    for (const item of items) {
      await this.ordersRepository.incrementProductStock(item.productId, item.quantity);
    }
  }
}

