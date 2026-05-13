import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.SMTP_PASS;
    this.from = process.env.SMTP_FROM || 'onboarding@resend.dev';

    if (!apiKey) {
      throw new InternalServerErrorException('SMTP_PASS (Resend API Key) is not defined');
    }
    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetEmail(input: {
    to: string;
    resetUrl?: string;
    token?: string;
    ttlMinutes?: number;
  }): Promise<void> {
    const email = input.to;
    const token = input.token || input.resetUrl?.split('token=')[1] || '';
    const resetUrl = input.resetUrl || `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Restablecer contraseña',
      html: `
        <h1>Restablecer contraseña</h1>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetUrl}">Restablecer contraseña</a>
        <p>Si no has solicitado esto, puedes ignorar este correo.</p>
      `,
    });

    if (error) {
      this.logger.error(`Error sending password reset email: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  async sendEmailVerificationEmail(input: {
    to: string;
    verifyUrl?: string;
    token?: string;
    ttlMinutes?: number;
  }): Promise<void> {
    const email = input.to;
    const token = input.token || input.verifyUrl?.split('token=')[1] || '';
    const verifyUrl = input.verifyUrl || `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Verificar correo electrónico',
      html: `
        <h1>Verificar correo electrónico</h1>
        <p>Gracias por registrarte. Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
        <a href="${verifyUrl}">Verificar correo electrónico</a>
      `,
    });

    if (error) {
      this.logger.error(`Error sending verification email: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  async sendLowStockAlertEmail(input: {
    to?: string;
    productId?: string;
    productName?: string;
    warehouseId?: string;
    availableQuantity?: number;
    currentStock?: number;
    lowStockThreshold?: number;
  }): Promise<void> {
    const productName = input.productName || input.productId || 'Unknown Product';
    const currentStock = input.currentStock ?? input.availableQuantity ?? 0;
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: process.env.ADMIN_EMAIL || this.from,
      subject: `Alerta de stock bajo: ${productName}`,
      html: `
        <h1>Alerta de stock bajo</h1>
        <p>El producto <strong>${productName}</strong> tiene poco stock disponible.</p>
        <p>Stock actual: <strong>${currentStock}</strong></p>
      `,
    });

    if (error) {
      this.logger.error(`Error sending low stock alert: ${JSON.stringify(error)}`);
    }
  }

  async sendPaymentConfirmationEmail(input: {
    to?: string;
    email?: string;
    orderId: string;
    total: number;
    transactionId?: string;
    customerName?: string | null;
  }): Promise<void> {
    const email = input.email || input.to || '';
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: `Confirmación de pago - Pedido #${input.orderId}`,
      html: `
        <h1>¡Gracias por tu compra!</h1>
        <p>Hemos recibido tu pago para el pedido <strong>#${input.orderId}</strong>.</p>
        <p>Total pagado: <strong>$${input.total}</strong></p>
        <p>Pronto recibirás un correo con los detalles de tu envío.</p>
      `,
    });

    if (error) {
      this.logger.error(`Error sending payment confirmation email: ${JSON.stringify(error)}`);
    }
  }
}
