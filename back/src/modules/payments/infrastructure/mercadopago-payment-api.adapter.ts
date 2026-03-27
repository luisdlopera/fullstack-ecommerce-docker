import { Injectable } from '@nestjs/common';
import type {
  MercadoPagoInitCheckoutInput,
  MercadoPagoInitCheckoutResult,
  MercadoPagoPaymentApiPort,
  MercadoPagoPaymentRecord,
} from '../domain/ports/mercadopago-payment-api.port';

@Injectable()
export class MercadoPagoPaymentApiAdapter implements MercadoPagoPaymentApiPort {
  async fetchPaymentById(paymentId: string, accessToken: string): Promise<MercadoPagoPaymentRecord | null> {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as MercadoPagoPaymentRecord;
  }

  async initCheckout(
    input: MercadoPagoInitCheckoutInput,
    accessToken: string,
  ): Promise<MercadoPagoInitCheckoutResult | null> {
    const payload = {
      external_reference: input.externalReference,
      items: [
        {
          title: input.title,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          currency_id: 'USD',
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      back_urls: input.backUrls,
      auto_return: 'approved',
      notification_url: input.notificationUrl,
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
    };

    if (!body.id || !body.init_point) {
      return null;
    }

    return {
      id: body.id,
      initPoint: body.init_point,
      sandboxInitPoint: body.sandbox_init_point,
    };
  }
}
