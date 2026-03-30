import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { EmailService } from '../../../shared/infrastructure/email/email.service';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { LoginDto } from '../infrastructure/http/dto/login.dto';
import { RegisterDto } from '../infrastructure/http/dto/register.dto';
import type { JwtPayload } from '../../../shared/infrastructure/auth/jwt-payload';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
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

  private getFrontendBaseUrl(): string {
    return (process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  private hashResetToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async register(input: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        password: bcryptjs.hashSync(input.password, 10),
        role: Role.CUSTOMER,
      },
    });

    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user: await this.buildAuthUser(user.id), ...tokens };
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !bcryptjs.compareSync(input.password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
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

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user: await this.buildAuthUser(user.id), ...tokens };
  }

  async refresh(
    refreshToken: string,
  ): Promise<AuthTokens & { user: AuthUserPayload }> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Missing JWT_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, { secret });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!stored || stored.expiresAt < new Date()) {
        if (stored) await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      await this.prisma.refreshToken.delete({ where: { id: stored.id } });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!user) throw new UnauthorizedException('User not found');

      const tokens = await this.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return { ...tokens, user: await this.buildAuthUser(user.id) };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async me(userId: string) {
    return this.buildAuthUser(userId);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } else {
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
    return { ok: true };
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
      this.prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return { ok: true };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const ttl = process.env.JWT_REFRESH_TTL ?? '7d';
    const ms = this.parseTtlToMs(ttl);
    const expiresAt = new Date(Date.now() + ms);

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
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

  private async signTokens(basePayload: Omit<JwtPayload, 'type'>): Promise<AuthTokens> {
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
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret,
      expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as never,
      jwtid: randomUUID(),
    });

    return { accessToken, refreshToken };
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
