import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { EMAIL_SENDER, type EmailSenderPort } from '../../domain/ports/email-sender.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';
import { getFrontendBaseUrl, getPasswordResetTtlMs } from '../../../../shared/domain/utils/auth.utils';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(email: string): Promise<{ ok: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    // Anti-enumeration: always return the same response
    if (!user || !user.isActive) {
      return { ok: true, message: AuthMessages.PASSWORD_RESET_EMAIL_SENT };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const ttlMs = getPasswordResetTtlMs();
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.authRepository.createPasswordResetToken({
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    const resetUrl = `${getFrontendBaseUrl()}/auth/reset-password/${encodeURIComponent(rawToken)}`;
    await this.emailSender.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      ttlMinutes: Math.ceil(ttlMs / 60000),
    });

    return { ok: true, message: AuthMessages.PASSWORD_RESET_EMAIL_SENT };
  }

  private hashResetToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
