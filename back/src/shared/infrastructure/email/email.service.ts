import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
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

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
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
      console.error('Error sending password reset email:', error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  async sendEmailVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
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
      console.error('Error sending verification email:', error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  async sendLowStockAlertEmail(productName: string, currentStock: number): Promise<void> {
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
      console.error('Error sending low stock alert:', error);
    }
  }

  async sendPaymentConfirmationEmail(email: string, orderId: string, total: number): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: `Confirmación de pago - Pedido #${orderId}`,
      html: `
        <h1>¡Gracias por tu compra!</h1>
        <p>Hemos recibido tu pago para el pedido <strong>#${orderId}</strong>.</p>
        <p>Total pagado: <strong>$${total}</strong></p>
        <p>Pronto recibirás un correo con los detalles de tu envío.</p>
      `,
    });

    if (error) {
      console.error('Error sending payment confirmation email:', error);
    }
  }
}
