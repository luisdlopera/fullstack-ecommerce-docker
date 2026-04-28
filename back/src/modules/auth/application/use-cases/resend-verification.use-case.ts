import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { EMAIL_SENDER, type EmailSenderPort } from '../../domain/ports/email-sender.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';
import {
  normalizeEmail,
  hashValue,
  getFrontendBaseUrl,
  getEmailVerificationTtlMs,
} from '../../../../shared/domain/utils/auth.utils';

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(email: string): Promise<{ ok: boolean; message: string }> {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    // Anti-enumeration: always return the same response
    if (!user || !user.isActive || user.emailVerified) {
      return { ok: true, message: AuthMessages.EMAIL_VERIFICATION_RESENT };
    }

    await this.issueEmailVerification(user.id, user.email);
    return { ok: true, message: AuthMessages.EMAIL_VERIFICATION_RESENT };
  }

  private async issueEmailVerification(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashValue(rawToken);
    const ttlMs = getEmailVerificationTtlMs();

    await this.authRepository.issueEmailVerificationToken({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + ttlMs),
    });

    const verifyUrl = `${getFrontendBaseUrl()}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
    await this.emailSender.sendEmailVerificationEmail({
      to: email,
      verifyUrl,
      ttlMinutes: Math.ceil(ttlMs / 60000),
    });
  }
}
