import { Inject, Injectable, Logger } from '@nestjs/common';
import type { MercadoPagoWebhookBodyDto } from '../../infrastructure/http/dto/mercadopago-webhook.dto';
import { verifyMercadoPagoWebhookSignature } from '../../infrastructure/http/mercadopago-webhook-signature.util';
import type { MercadoPagoPaymentApiPort } from '../../domain/ports/mercadopago-payment-api.port';
import { MERCADOPAGO_PAYMENT_API } from '../../domain/ports/mercadopago-payment-api.port';
import { ProcessMercadoPagoPaymentUseCase } from './process-mercadopago-payment.use-case';
import { UnauthorizedError } from '../../../../shared/domain/errors/domain-error';

export type WebhookRequestMeta = {
  xSignature?: string;
  xRequestId?: string;
  dataIdQuery?: string;
};

@Injectable()
export class HandleMercadoPagoWebhookUseCase {
  private readonly logger = new Logger(HandleMercadoPagoWebhookUseCase.name);

  constructor(
    @Inject(MERCADOPAGO_PAYMENT_API) private readonly mpApi: MercadoPagoPaymentApiPort,
    @Inject(ProcessMercadoPagoPaymentUseCase)
    private readonly processPayment: ProcessMercadoPagoPaymentUseCase,
  ) {}

  async execute(dto: MercadoPagoWebhookBodyDto, meta: WebhookRequestMeta) {
    const skipVerify = process.env.MP_WEBHOOK_SKIP_VERIFY === 'true';
    const dataIdRaw = dto.data?.id ?? meta.dataIdQuery;
    const dataId = dataIdRaw != null && dataIdRaw !== '' ? String(dataIdRaw) : '';

    if (!skipVerify) {
      const secret = process.env.MP_WEBHOOK_SECRET;
      if (!secret) {
        this.logger.warn('MP_WEBHOOK_SECRET is not configured');
        throw new UnauthorizedError('Webhook not configured');
      }
      if (
        !verifyMercadoPagoWebhookSignature({
          secret,
          xSignature: meta.xSignature,
          xRequestId: meta.xRequestId,
          dataId,
        })
      ) {
        throw new UnauthorizedError('Invalid webhook signature');
      }
    }

    const type = dto.type ?? dto.action;
    if (type !== 'payment') {
      return { ok: true, ignored: true };
    }

    if (!dataId) {
      return { ok: true, ignored: true };
    }

    return this.processWebhookPaymentById(dataId);
  }

  private async processWebhookPaymentById(dataId: string) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      this.logger.warn('Webhook received but MP_ACCESS_TOKEN is not configured');
      return { ok: false, reason: 'not_configured' };
    }

    try {
      const payment = await this.mpApi.fetchPaymentById(dataId, accessToken);
      if (!payment) {
        this.logger.warn(`Webhook: failed to fetch payment ${dataId}`);
        return { ok: false, reason: 'fetch_failed' };
      }

      return await this.processPayment.execute(payment);
    } catch (err) {
      this.logger.error(`Webhook processing error for payment ${dataId}`, err as Error);
      return { ok: false, reason: 'processing_error' };
    }
  }
}
