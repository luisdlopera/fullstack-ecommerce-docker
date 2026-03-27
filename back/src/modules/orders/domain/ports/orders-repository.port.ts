import type { Order, OrderAddress, OrderItem, OrderStatus, Prisma, Size } from '@prisma/client';
import type { CreateOrderDto, UpdateOrderPaymentDto } from '../../infrastructure/http/dto/create-order.dto';

export const ORDERS_REPOSITORY = Symbol('ORDERS_REPOSITORY');

export type CheckoutProductRow = {
  id: string;
  price: number;
  inStock: number;
  sizes: Size[];
};

export type OrderWithItemsAndAddress = Order & {
  OrderItem: OrderItem[];
  OrderAddress: OrderAddress | null;
};

export type OrderDetailPayload = Prisma.OrderGetPayload<{
  include: {
    OrderItem: { include: { product: true } };
    OrderAddress: { include: { country: true } };
  };
}>;

export interface OrdersRepositoryPort {
  findProductsByIds(ids: string[]): Promise<CheckoutProductRow[]>;
  createOrderWithStockTx(
    userId: string,
    dto: CreateOrderDto,
    productMap: Map<string, CheckoutProductRow>,
    subTotal: number,
    tax: number,
    total: number,
    itemsInOrder: number,
  ): Promise<OrderWithItemsAndAddress>;

  findOrdersForUser(userId: string, skip: number, take: number): Promise<OrderWithItemsAndAddress[]>;

  findOrderDetailById(orderId: string): Promise<OrderDetailPayload | null>;

  findOrderBasic(orderId: string): Promise<Order | null>;

  updateOrderById(orderId: string, data: { status?: OrderStatus }): Promise<OrderWithItemsAndAddress>;

  markOrderPaid(orderId: string, dto: UpdateOrderPaymentDto): Promise<Order>;

  listOrderItemsForStock(orderId: string): Promise<Array<{ productId: string; quantity: number }>>;

  incrementProductStock(productId: string, quantity: number): Promise<void>;
}
