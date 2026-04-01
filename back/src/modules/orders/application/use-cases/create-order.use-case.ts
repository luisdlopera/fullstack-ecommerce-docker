import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { InventoryService } from '../../../inventory/application/inventory.service';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../../domain/ports/orders-repository.port';
import { CreateOrderDto } from '../../infrastructure/http/dto/create-order.dto';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_REPOSITORY) private readonly ordersRepository: OrdersRepositoryPort,
    @Inject(InventoryService) private readonly inventoryService: InventoryService,
  ) {}

  async execute(userId: string | undefined, dto: CreateOrderDto) {
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

    const guestCheckoutToken = !userId ? randomUUID() : undefined;

    const order = await this.ordersRepository.createOrderWithStockTx(
      userId,
      dto,
      productMap,
      subTotal,
      tax,
      total,
      itemsInOrder,
      guestCheckoutToken,
    );

    try {
      await this.inventoryService.reserveStock(
        dto.items.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
        order.id,
        userId ?? `guest_${order.id}`,
      );
    } catch (error) {
      await this.ordersRepository.updateOrderById(order.id, { status: OrderStatus.CANCELLED });
      throw error;
    }

    return order;
  }
}
