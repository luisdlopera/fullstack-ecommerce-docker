export const MERCADOPAGO_PAYMENT_API = Symbol('MERCADOPAGO_PAYMENT_API');

export type MercadoPagoPaymentRecord = {
  id: number;
  status: string;
  transaction_amount: number;
  external_reference?: string;
};

export type MercadoPagoInitCheckoutInput = {
  externalReference: string;
  title: string;
  unitPrice: number;
  quantity: number;
  payerEmail?: string;
  notificationUrl?: string;
  backUrls: {
    success: string;
    pending: string;
    failure: string;
  };
};

export type MercadoPagoInitCheckoutResult = {
  id: string;
  initPoint: string;
  sandboxInitPoint?: string;
};

export interface MercadoPagoPaymentApiPort {
  fetchPaymentById(paymentId: string, accessToken: string): Promise<MercadoPagoPaymentRecord | null>;
  initCheckout(
    input: MercadoPagoInitCheckoutInput,
    accessToken: string,
  ): Promise<MercadoPagoInitCheckoutResult | null>;
}
