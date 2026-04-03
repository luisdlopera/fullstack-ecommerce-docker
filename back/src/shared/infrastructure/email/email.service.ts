import { Injectable, InternalServerErrorException } from '@nestjs/common';
import nodemailer from 'nodemailer';

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  ttlMinutes: number;
};

type EmailVerificationInput = {
  to: string;
  verifyUrl: string;
  ttlMinutes: number;
};

type LowStockAlertInput = {
  to: string;
  productId: string;
  warehouseId: string;
  availableQuantity: number;
  lowStockThreshold: number;
};

type PaymentConfirmationInput = {
  to: string;
  orderId: string;
  total: number;
  transactionId: string;
  customerName?: string | null;
};

@Injectable()
export class EmailService {
  private readonly transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  private ensureConfigured() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
      throw new InternalServerErrorException('SMTP is not configured');
    }
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    this.ensureConfigured();

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <h2>Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña de NexStore.</p>
        <p>
          <a href="${input.resetUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
            Restablecer contraseña
          </a>
        </p>
        <p>Este enlace expira en ${input.ttlMinutes} minutos y solo puede usarse una vez.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      </div>
    `;

    await this.transport.sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject: 'Restablece tu contraseña - NexStore',
      text: `Restablece tu contraseña con este enlace: ${input.resetUrl}. El enlace expira en ${input.ttlMinutes} minutos.`,
      html,
    });
  }

  async sendEmailVerificationEmail(input: EmailVerificationInput): Promise<void> {
    this.ensureConfigured();

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
        <h2>Verifica tu correo</h2>
        <p>Confirma tu correo para activar tu cuenta en NexStore.</p>
        <p>
          <a href="${input.verifyUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
            Verificar correo
          </a>
        </p>
        <p>Este enlace expira en ${input.ttlMinutes} minutos y solo puede usarse una vez.</p>
      </div>
    `;

    await this.transport.sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject: 'Verifica tu correo - NexStore',
      text: `Verifica tu correo con este enlace: ${input.verifyUrl}. El enlace expira en ${input.ttlMinutes} minutos.`,
      html,
    });
  }

  async sendLowStockAlertEmail(input: LowStockAlertInput): Promise<void> {
    this.ensureConfigured();

    const frontendUrl = process.env.FRONTEND_URL ?? '';
    const settingsUrl = frontendUrl ? `${frontendUrl.replace(/\/$/, '')}/admin/inventory` : '';

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e6e6;border-radius:12px;overflow:hidden;">
          <div style="background:#111;color:#ffffff;padding:16px 20px;font-size:18px;font-weight:700;letter-spacing:0.4px;">
            NexStore
          </div>
          <div style="padding:20px;color:#111;line-height:1.6;">
            <h2 style="margin:0 0 12px 0;font-size:20px;">Alerta de bajo stock</h2>
            <p style="margin:0 0 16px 0;">Se detecto stock bajo en un producto.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:8px 0;color:#666;">Producto</td>
                <td style="padding:8px 0;font-weight:600;">${input.productId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Warehouse</td>
                <td style="padding:8px 0;font-weight:600;">${input.warehouseId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Disponible</td>
                <td style="padding:8px 0;font-weight:600;">${input.availableQuantity}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Umbral</td>
                <td style="padding:8px 0;font-weight:600;">${input.lowStockThreshold}</td>
              </tr>
            </table>
            ${
              settingsUrl
                ? `
              <div style="margin-top:20px;">
                <a href="${settingsUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
                  Ver inventario
                </a>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;

    await this.transport.sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject: 'Alerta de bajo stock - NexStore',
      text: `Alerta de bajo stock. Producto: ${input.productId}. Warehouse: ${input.warehouseId}. Disponible: ${input.availableQuantity}. Umbral: ${input.lowStockThreshold}.`,
      html,
    });
  }

  async sendPaymentConfirmationEmail(input: PaymentConfirmationInput): Promise<void> {
    this.ensureConfigured();

    const customer = input.customerName ? `Hola ${input.customerName},` : 'Hola,';
    const frontendUrl = process.env.FRONTEND_URL ?? '';
    const orderUrl = frontendUrl ? `${frontendUrl.replace(/\/$/, '')}/account/orders/${input.orderId}` : '';

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e6e6;border-radius:12px;overflow:hidden;">
          <div style="background:#111;color:#ffffff;padding:16px 20px;font-size:18px;font-weight:700;letter-spacing:0.4px;">
            NexStore
          </div>
          <div style="padding:20px;color:#111;line-height:1.6;">
            <h2 style="margin:0 0 12px 0;font-size:20px;">Pago confirmado</h2>
            <p style="margin:0 0 16px 0;">${customer} tu pago fue confirmado.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:8px 0;color:#666;">Orden</td>
                <td style="padding:8px 0;font-weight:600;">${input.orderId}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Total</td>
                <td style="padding:8px 0;font-weight:600;">${input.total}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;">Transaccion</td>
                <td style="padding:8px 0;font-weight:600;">${input.transactionId}</td>
              </tr>
            </table>
            ${
              orderUrl
                ? `
              <div style="margin-top:20px;">
                <a href="${orderUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
                  Ver pedido
                </a>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;

    await this.transport.sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject: 'Pago confirmado - NexStore',
      text: `${customer} tu pago fue confirmado. Orden: ${input.orderId}. Total: ${input.total}. Transaccion: ${input.transactionId}.`,
      html,
    });
  }
}
