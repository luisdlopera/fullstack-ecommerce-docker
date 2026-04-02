import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { resolveMx } from 'node:dns/promises';
import speakeasy from 'speakeasy';
import { LoginDto } from '../infrastructure/http/dto/login.dto';
import { RegisterDto } from '../infrastructure/http/dto/register.dto';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../domain/ports/auth-repository.port';
import { EMAIL_SENDER, type EmailSenderPort } from '../domain/ports/email-sender.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../domain/ports/token-service.port';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type ClientMeta = {
  ip?: string;
  userAgent?: string;
};

type AuthUserPayload = {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles: Role[];
  permissions: string[];
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSenderPort,
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  private getPasswordResetTtlMs(): number {
    const minutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30);
    if (!Number.isFinite(minutes) || minutes <= 0) return 30 * 60 * 1000;
    return Math.floor(minutes * 60 * 1000);
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

  private hashResetToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
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
      throw new UnauthorizedException('Invalid email domain');
    }

    if (this.getDisposableDomains().has(domain)) {
      throw new UnauthorizedException('Disposable email addresses are not allowed');
    }

    const mustValidateMx = (process.env.EMAIL_MX_REQUIRED ?? 'true') === 'true';
    if (!mustValidateMx) return;

    try {
      const records = await Promise.race([
        resolveMx(domain),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('MX lookup timeout')), 1500)),
      ]);
      if (!records?.length) {
        throw new UnauthorizedException('Email domain cannot receive email');
      }
    } catch {
      throw new UnauthorizedException('Email domain cannot receive email');
    }
  }

  private isPrivilegedRole(role: Role): boolean {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
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

  async register(input: RegisterDto) {
    return this.registerUseCase.execute(input);
  }

  async login(input: LoginDto, clientMeta: ClientMeta = {}) {
    return this.loginUseCase.execute(input, clientMeta);
  }

  async refresh(refreshToken: string, clientMeta: ClientMeta = {}): Promise<AuthTokens & { user: AuthUserPayload }> {
    return this.refreshTokenUseCase.execute(refreshToken, clientMeta);
  }

  async me(userId: string) {
    return this.buildAuthUser(userId);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashValue(refreshToken);
      await this.authRepository.revokeRefreshTokensByHash(userId, tokenHash);
      await this.authRepository.revokeRefreshTokensByToken(userId, refreshToken);
    } else {
      await this.authRepository.revokeRefreshTokensByUser(userId);
    }
    return { ok: true };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashValue(token);
    const verification = await this.authRepository.findEmailVerificationToken(tokenHash);

    if (!verification || verification.usedAt || (verification.expiresAt && verification.expiresAt <= new Date()) || !verification.user?.isActive) {
      throw new UnauthorizedException('Verification token is invalid or expired');
    }

    await this.authRepository.completeEmailVerification(
      verification.userId,
      verification.id,
      new Date(),
    );

    return { ok: true, message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    if (!user || !user.isActive || user.emailVerified) {
      return { ok: true, message: 'If the account exists, we sent a verification email.' };
    }

    await this.issueEmailVerification(user.id, user.email);
    return { ok: true, message: 'If the account exists, we sent a verification email.' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    // Anti-enumeration: always return the same response.
    if (!user || !user.isActive) {
      return { ok: true, message: 'Si el correo existe, enviaremos instrucciones para recuperar la contraseña.' };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const ttlMs = this.getPasswordResetTtlMs();
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.authRepository.createPasswordResetToken({
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    const resetUrl = `${this.getFrontendBaseUrl()}/auth/reset-password/${encodeURIComponent(rawToken)}`;
    await this.emailSender.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      ttlMinutes: Math.ceil(ttlMs / 60000),
    });

    return { ok: true, message: 'Si el correo existe, enviaremos instrucciones para recuperar la contraseña.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashResetToken(token);
    const resetToken = await this.authRepository.findPasswordResetToken(tokenHash);

    if (!resetToken || resetToken.usedAt || (resetToken.expiresAt && resetToken.expiresAt <= new Date()) || !resetToken.user?.isActive) {
      throw new UnauthorizedException('El token es invalido o ha expirado');
    }

    await this.authRepository.completePasswordReset(
      resetToken.userId,
      resetToken.id,
      bcryptjs.hashSync(newPassword, 10),
    );

    return { ok: true };
  }

  async enrollMfa(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user) throw new UnauthorizedException('User not found');
    if (!this.isPrivilegedRole(user.role)) {
      throw new ForbiddenException('MFA enrollment is available only for admin accounts');
    }

    const generated = speakeasy.generateSecret({
      issuer: 'NexStore',
      name: user.email,
      length: 20,
    });
    const secret = generated.base32;
    const otpauthUrl = generated.otpauth_url;

    if (!secret || !otpauthUrl) {
      throw new UnauthorizedException('Unable to generate MFA enrollment data');
    }

    await this.authRepository.updateUser(userId, { mfaSecret: secret, mfaEnabled: false });

    return { ok: true, secret, otpauthUrl };
  }

  async verifyMfaEnrollment(userId: string, code: string) {
    const user = await this.authRepository.findUserById(userId);

    const validCode =
      !!user?.mfaSecret &&
      speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 1,
      });

    if (!validCode) {
      throw new UnauthorizedException('Invalid MFA verification code');
    }

    await this.authRepository.updateUser(userId, { mfaEnabled: true });

    return { ok: true };
  }

  async disableMfa(userId: string, code: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user?.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA is not enabled');
    }
    const validCode = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    if (!validCode) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.authRepository.updateUser(userId, { mfaEnabled: false, mfaSecret: null });

    return { ok: true };
  }

  private async storeRefreshToken(input: {
    userId: string;
    refreshToken: string;
    refreshJti: string;
    familyId: string;
    meta?: ClientMeta;
  }) {
    const ttl = process.env.JWT_REFRESH_TTL ?? '7d';
    const ms = this.parseTtlToMs(ttl);
    const expiresAt = new Date(Date.now() + ms);

    await this.authRepository.createRefreshToken({
      token: input.refreshToken,
      tokenHash: this.hashValue(input.refreshToken),
      jti: input.refreshJti,
      familyId: input.familyId,
      userId: input.userId,
      expiresAt,
      userAgentHash: input.meta?.userAgent ? this.hashValue(input.meta.userAgent) : null,
      ipHash: input.meta?.ip ? this.hashValue(input.meta.ip) : null,
    });

    await this.authRepository.revokeExpiredRefreshTokens(input.userId);
  }

  private parseTtlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[unit] ?? 86400000);
  }

  private async buildAuthUser(userId: string): Promise<AuthUserPayload> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const rolePermissions = await this.authRepository.listRolePermissions(user.role);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: [user.role],
      permissions: rolePermissions,
    };
  }
}
