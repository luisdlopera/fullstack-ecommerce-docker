export const PAYMENT_ORDER_REPOSITORY = Symbol('PAYMENT_ORDER_REPOSITORY');

export type OrderPaymentRow = {
  id: string;
  userId: string | null;
  total: number;
  isPaid: boolean;
  transactionId: string | null;
  guestEmail: string | null;
  guestCheckoutToken: string | null;
};

export type PaymentRecipient = {
  orderId: string;
  total: number;
  transactionId: string | null;
  email: string | null;
  name: string | null;
};

export type MarkOrderPaidAtomicResult =
  | { status: 'paid' }
  | { status: 'already_paid'; existingTransactionId: string | null }
  | { status: 'conflict'; existingTransactionId: string | null };

export interface PaymentOrderRepositoryPort {
  findOrderById(orderId: string): Promise<OrderPaymentRow | null>;
  findPaymentRecipient(orderId: string): Promise<PaymentRecipient | null>;
  markOrderPaidAtomic(orderId: string, transactionId: string): Promise<MarkOrderPaidAtomicResult>;
}
