import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { resolveMx } from 'node:dns/promises';
import speakeasy from 'speakeasy';
import { EmailService } from '../../../shared/infrastructure/email/email.service';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { LoginDto } from '../infrastructure/http/dto/login.dto';
import { RegisterDto } from '../infrastructure/http/dto/register.dto';
import type { JwtPayload } from '../../../shared/infrastructure/auth/jwt-payload';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type SignedTokens = AuthTokens & {
  refreshJti: string;
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
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(EmailService) private readonly emailService: EmailService,
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
    return (process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
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

    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });

    const verifyUrl = `${this.getFrontendBaseUrl()}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
    await this.emailService.sendEmailVerificationEmail({
      to: email,
      verifyUrl,
      ttlMinutes: Math.ceil(ttlMs / 60000),
    });
  }

  async register(input: RegisterDto) {
    const normalizedEmail = this.normalizeEmail(input.email);
    await this.assertTrustedEmailAddress(normalizedEmail);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: normalizedEmail,
        password: bcryptjs.hashSync(input.password, 10),
        role: Role.CUSTOMER,
      },
    });

    await this.issueEmailVerification(user.id, user.email);

    return {
      ok: true,
      message: 'We sent a verification email. Please verify your email before signing in.',
    };
  }

  async login(input: LoginDto, clientMeta: ClientMeta = {}) {
    const normalizedEmail = this.normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !bcryptjs.compareSync(input.password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email address is not verified');
    }

    if (user.mfaEnabled && this.isPrivilegedRole(user.role)) {
      if (!input.mfaCode) {
        throw new UnauthorizedException('MFA code is required');
      }
      const validMfaCode =
        !!user.mfaSecret &&
        speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: 'base32',
          token: input.mfaCode,
          window: 1,
        });
      if (!validMfaCode) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      refreshJti: tokens.refreshJti,
      familyId: randomUUID(),
      meta: clientMeta,
    });

    return {
      user: await this.buildAuthUser(user.id),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string, clientMeta: ClientMeta = {}): Promise<AuthTokens & { user: AuthUserPayload }> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Missing JWT_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload & { jti?: string }>(refreshToken, { secret });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      if (!payload.jti) {
        throw new UnauthorizedException('Missing refresh token identifier');
      }

      const tokenHash = this.hashValue(refreshToken);

      let stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!stored) {
        stored = await this.prisma.refreshToken.findUnique({
          where: { token: refreshToken },
        });
      }

      if (!stored) {
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      if (stored.revokedAt) {
        if (stored.familyId) {
          await this.revokeRefreshTokenFamily(stored.familyId);
        }
        throw new UnauthorizedException('Refresh token reuse detected. Please sign in again.');
      }

      if (stored.expiresAt < new Date()) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true },
      });

      if (!user) throw new UnauthorizedException('User not found');
      if (!user.isActive || !user.emailVerified) {
        throw new UnauthorizedException('User is not allowed to refresh session');
      }

      const tokens = await this.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      const familyId = stored.familyId ?? randomUUID();

      await this.prisma.$transaction([
        this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date(), replacedByJti: tokens.refreshJti, lastUsedAt: new Date(), familyId },
        }),
        this.prisma.refreshToken.create({
          data: {
            tokenHash: this.hashValue(tokens.refreshToken),
            jti: tokens.refreshJti,
            token: tokens.refreshToken,
            familyId,
            userId: user.id,
            expiresAt: new Date(Date.now() + this.parseTtlToMs(process.env.JWT_REFRESH_TTL ?? '7d')),
            userAgentHash: clientMeta.userAgent ? this.hashValue(clientMeta.userAgent) : null,
            ipHash: clientMeta.ip ? this.hashValue(clientMeta.ip) : null,
          },
        }),
      ]);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: await this.buildAuthUser(user.id),
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async me(userId: string) {
    return this.buildAuthUser(userId);
  }

  async logout(userId: string, refreshToken?: string) {
    const now = new Date();
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
          OR: [{ tokenHash: this.hashValue(refreshToken) }, { token: refreshToken }],
        },
        data: { revokedAt: now },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
    }
    return { ok: true };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashValue(token);
    const verification = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!verification || verification.usedAt || verification.expiresAt <= new Date() || !verification.user.isActive) {
      throw new UnauthorizedException('Verification token is invalid or expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.updateMany({
        where: { userId: verification.userId, usedAt: null, id: { not: verification.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true, message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, isActive: true, emailVerified: true },
    });

    if (!user || !user.isActive || user.emailVerified) {
      return { ok: true, message: 'If the account exists, we sent a verification email.' };
    }

    await this.issueEmailVerification(user.id, user.email);
    return { ok: true, message: 'If the account exists, we sent a verification email.' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, isActive: true },
    });

    // Anti-enumeration: always return the same response.
    if (!user || !user.isActive) {
      return { ok: true, message: 'Si el correo existe, enviaremos instrucciones para recuperar la contraseña.' };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const ttlMs = this.getPasswordResetTtlMs();
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${this.getFrontendBaseUrl()}/auth/reset-password/${encodeURIComponent(rawToken)}`;
    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      ttlMinutes: Math.ceil(ttlMs / 60000),
    });

    return { ok: true, message: 'Si el correo existe, enviaremos instrucciones para recuperar la contraseña.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashResetToken(token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date() || !resetToken.user.isActive) {
      throw new UnauthorizedException('El token es invalido o ha expirado');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: bcryptjs.hashSync(newPassword, 10) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  async enrollMfa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

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

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret, mfaEnabled: false },
    });

    return { ok: true, secret, otpauthUrl };
  }

  async verifyMfaEnrollment(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaSecret: true },
    });

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

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { ok: true };
  }

  async disableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mfaEnabled: true, mfaSecret: true },
    });

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

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

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

    await this.prisma.refreshToken.create({
      data: {
        token: input.refreshToken,
        tokenHash: this.hashValue(input.refreshToken),
        jti: input.refreshJti,
        familyId: input.familyId,
        userId: input.userId,
        expiresAt,
        userAgentHash: input.meta?.userAgent ? this.hashValue(input.meta.userAgent) : null,
        ipHash: input.meta?.ip ? this.hashValue(input.meta.ip) : null,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: input.userId, expiresAt: { lt: new Date() }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeRefreshTokenFamily(familyId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private parseTtlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * (multipliers[unit] ?? 86400000);
  }

  private async signTokens(basePayload: Omit<JwtPayload, 'type'>): Promise<SignedTokens> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Missing JWT_SECRET');

    const accessPayload: JwtPayload = { ...basePayload, type: 'access' };
    const refreshPayload: JwtPayload = { ...basePayload, type: 'refresh' };

    // Unique jti so RefreshToken.token is never duplicated (same user + same iat produced identical JWTs before).
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret,
      expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never,
      jwtid: randomUUID(),
    });
    const refreshJti = randomUUID();
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret,
      expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as never,
      jwtid: refreshJti,
    });

    return { accessToken, refreshToken, refreshJti };
  }

  private async buildAuthUser(userId: string): Promise<AuthUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      select: { permissionId: true },
      orderBy: { permissionId: 'asc' },
    });

    return {
      ...user,
      roles: [user.role],
      permissions: rolePermissions.map((item) => item.permissionId),
    };
  }
}
