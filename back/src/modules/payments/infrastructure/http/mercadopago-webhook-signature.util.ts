import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Mercado Pago webhook signature (x-signature header, v1 HMAC-SHA256).
 * @see https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks/webhook-reception
 */
export function verifyMercadoPagoWebhookSignature(opts: {
  secret: string;
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string;
}): boolean {
  const { secret, xSignature, xRequestId, dataId } = opts;
  if (!xSignature?.trim() || !xRequestId?.trim() || !dataId) {
    return false;
  }

  let ts = '';
  let v1 = '';
  for (const part of xSignature.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 'ts') ts = value;
    if (key === 'v1') v1 = value;
  }

  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedHex = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(expectedHex, 'utf8'), Buffer.from(v1, 'utf8'));
  } catch {
    return false;
  }
}
