export const PAYMENT_NOTIFICATION = Symbol('PAYMENT_NOTIFICATION');

export type PaymentConfirmationMessage = {
  orderId: string;
  total: number;
  transactionId: string;
  email: string;
  customerName?: string | null;
};

export interface PaymentNotificationPort {
  enqueuePaymentConfirmation(message: PaymentConfirmationMessage): Promise<void>;
}
