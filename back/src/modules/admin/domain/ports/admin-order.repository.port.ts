import type { OrderStatus, PaymentStatus } from '@prisma/client';

export const ADMIN_ORDER_REPOSITORY = Symbol('ADMIN_ORDER_REPOSITORY');

export type AdminOrderListFilters = {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paid?: boolean;
};

export interface AdminOrderRepositoryPort {
  list(filters: AdminOrderListFilters): Promise<{ data: unknown[]; total: number }>;
  findById(orderId: string): Promise<unknown | null>;
  findBasic(orderId: string): Promise<{ id: string; status: OrderStatus; isPaid: boolean } | null>;
  updateStatus(
    orderId: string,
    data: { status: OrderStatus; isPaid?: boolean; paidAt?: Date; paymentStatus?: PaymentStatus },
  ): Promise<unknown>;
  updatePaymentStatus(
    orderId: string,
    data: { paymentStatus: PaymentStatus; isPaid?: boolean; paidAt?: Date },
  ): Promise<unknown>;
  updateNotes(orderId: string, internalNotes: string | null): Promise<unknown>;
  listOrderItems(orderId: string): Promise<Array<{ productId: string; quantity: number }>>;
}
