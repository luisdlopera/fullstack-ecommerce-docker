import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import { resolveMx } from 'node:dns/promises';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { EMAIL_SENDER, type EmailSenderPort } from '../../domain/ports/email-sender.port';
import { RegisterDto } from '../../infrastructure/http/dto/register.dto';
import { BadRequestError, ConflictError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
  ) {}

  async execute(input: RegisterDto) {
    const normalizedEmail = this.normalizeEmail(input.email);
    await this.assertTrustedEmailAddress(normalizedEmail);

    const existingUser = await this.authRepository.findUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictError('Email is already in use');
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
      message: 'We sent a verification email. Please verify your email before signing in.',
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getEmailVerificationTtlMs(): number {
    const minutes = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? 60 * 24);
    if (!Number.isFinite(minutes) || minutes <= 0) return 24 * 60 * 60 * 1000;
    return Math.floor(minutes * 60 * 1000);
  }

  private getFrontendBaseUrl(): string {
    return (process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? this.buildFallbackFrontendUrl()).replace(/\/$/, '');
  }

  private buildFallbackFrontendUrl(): string {
    const port = process.env.FRONTEND_PORT || process.env.FRONT_PORT || '5006';
    const host = process.env.FRONTEND_HOST || 'localhost';
    return `http://${host}:${port}`;
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private getDisposableDomains(): Set<string> {
    const configured = (process.env.DISPOSABLE_EMAIL_DOMAINS ?? '')
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
    const defaults = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com'];
    return new Set([...defaults, ...configured]);
  }

  private async assertTrustedEmailAddress(email: string): Promise<void> {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      throw new BadRequestError('Invalid email domain');
    }

    if (this.getDisposableDomains().has(domain)) {
      throw new BadRequestError('Disposable email addresses are not allowed');
    }

    const mustValidateMx = (process.env.EMAIL_MX_REQUIRED ?? 'true') === 'true';
    if (!mustValidateMx) return;

    try {
      const records = await Promise.race([
        resolveMx(domain),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('MX lookup timeout')), 1500)),
      ]);
      if (!records?.length) {
        throw new BadRequestError('Email domain cannot receive email');
      }
    } catch {
      throw new BadRequestError('Email domain cannot receive email');
    }
  }

  private async issueEmailVerification(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashValue(rawToken);
    const ttlMs = this.getEmailVerificationTtlMs();

    await this.authRepository.issueEmailVerificationToken({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + ttlMs),
    });

    const verifyUrl = `${this.getFrontendBaseUrl()}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
    await this.emailSender.sendEmailVerificationEmail({
      to: email,
      verifyUrl,
      ttlMinutes: Math.ceil(ttlMs / 60000),
    });
  }
}
