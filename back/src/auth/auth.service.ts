import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from '../common/auth/jwt-payload';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(input: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        password: bcryptjs.hashSync(input.password, 10),
        role: Role.user
      }
    });

    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    };
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (!user || !bcryptjs.compareSync(input.password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens & { user: { id: string; name: string; email: string; role: Role } }> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Missing JWT_SECRET');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, { secret });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const stored = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      if (!stored || stored.expiresAt < new Date()) {
        if (stored) await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        throw new UnauthorizedException('Refresh token expired or revoked');
      }

      await this.prisma.refreshToken.delete({ where: { id: stored.id } });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true }
      });

      if (!user) throw new UnauthorizedException('User not found');

      const tokens = await this.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role
      });

      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return { ...tokens, user };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    } else {
      await this.prisma.refreshToken.deleteMany({
        where: { userId }
      });
    }
    return { ok: true };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const ttl = process.env.JWT_REFRESH_TTL ?? '7d';
    const ms = this.parseTtlToMs(ttl);
    const expiresAt = new Date(Date.now() + ms);

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt }
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } }
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

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret,
      expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as never
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret,
      expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as never
    });

    return { accessToken, refreshToken };
  }
}
