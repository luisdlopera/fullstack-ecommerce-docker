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
}
