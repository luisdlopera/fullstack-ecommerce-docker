import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { randomBytes } from 'node:crypto';

import { resolveMx } from 'node:dns/promises';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { EMAIL_SENDER, type EmailSenderPort } from '../../domain/ports/email-sender.port';
import { RegisterDto } from '../../infrastructure/http/dto/register.dto';
import { BadRequestError, ConflictError } from '../../../../shared/domain/errors/domain-error';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';
import {
  normalizeEmail,
  hashValue,
  getFrontendBaseUrl,
  getEmailVerificationTtlMs,
  getDisposableDomains,
} from '../../../../shared/domain/utils/auth.utils';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(input: RegisterDto) {
    const normalizedEmail = normalizeEmail(input.email);
    await this.assertTrustedEmailAddress(normalizedEmail);

    const existingUser = await this.authRepository.findUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictError(AuthMessages.EMAIL_ALREADY_EXISTS);
    }

    const user = await this.authRepository.createUser({
      name: input.name,
      email: normalizedEmail,
      password: bcryptjs.hashSync(input.password, 10),
      role: Role.CUSTOMER,
    });

    await this.issueEmailVerification(user.id, user.email);

    return {
      ok: true,
      message: AuthMessages.REGISTER_SUCCESSFUL,
    };
  }

  private async assertTrustedEmailAddress(email: string): Promise<void> {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      throw new BadRequestError(AuthMessages.VALIDATION_ERROR);
    }

    if (getDisposableDomains().has(domain)) {
      throw new BadRequestError(AuthMessages.VALIDATION_ERROR);
    }

    const mustValidateMx = (process.env.EMAIL_MX_REQUIRED ?? 'true') === 'true';
    if (!mustValidateMx) return;

    try {
      const records = await Promise.race([
        resolveMx(domain),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('MX lookup timeout')), 1500)),
      ]);
      if (!records?.length) {
        throw new BadRequestError(AuthMessages.VALIDATION_ERROR);
      }
    } catch {
      throw new BadRequestError(AuthMessages.VALIDATION_ERROR);
    }
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
