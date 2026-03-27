export const PAYMENT_ORDER_REPOSITORY = Symbol('PAYMENT_ORDER_REPOSITORY');

export type OrderPaymentRow = {
  id: string;
  userId: string;
  total: number;
  isPaid: boolean;
  transactionId: string | null;
};

export type MarkOrderPaidAtomicResult =
  | { status: 'paid' }
  | { status: 'already_paid'; existingTransactionId: string | null }
  | { status: 'conflict'; existingTransactionId: string | null };

export interface PaymentOrderRepositoryPort {
  findOrderById(orderId: string): Promise<OrderPaymentRow | null>;
  markOrderPaidAtomic(orderId: string, transactionId: string): Promise<MarkOrderPaidAtomicResult>;
}
