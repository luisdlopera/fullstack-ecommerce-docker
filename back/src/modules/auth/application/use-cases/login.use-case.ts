import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import speakeasy from 'speakeasy';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../../domain/ports/token-service.port';
import { LoginDto } from '../../infrastructure/http/dto/login.dto';
import { UnauthorizedError } from '../../../../shared/domain/errors/domain-error';

export type AuthUserPayload = {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles: Role[];
  permissions: string[];
};

export type ClientMeta = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: LoginDto, clientMeta: ClientMeta = {}) {
    const normalizedEmail = this.normalizeEmail(input.email);
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    if (!user || !bcryptjs.compareSync(input.password, user.password)) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError('Email address is not verified');
    }

    if (user.mfaEnabled && this.isPrivilegedRole(user.role)) {
      if (!input.mfaCode) {
        throw new UnauthorizedError('MFA code is required');
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
        throw new UnauthorizedError('Invalid MFA code');
      }
    }

    await this.authRepository.updateUserLastLogin(user.id, new Date());

    const familyId = randomUUID();
    const tokens = await this.tokenService.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.storeRefreshToken({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      refreshJti: tokens.refreshJti,
      familyId,
      meta: clientMeta,
    });

    return {
      user: await this.buildAuthUser(user.id),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isPrivilegedRole(role: Role): boolean {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }

  private async storeRefreshToken(args: {
    userId: string;
    refreshToken: string;
    refreshJti: string;
    familyId: string;
    meta: ClientMeta;
  }) {
    const expiresAt = new Date(Date.now() + this.parseTtlToMs(process.env.JWT_REFRESH_TTL ?? '7d'));
    await this.authRepository.createRefreshToken({
      tokenHash: this.tokenService.hashToken(args.refreshToken),
      token: args.refreshToken,
      jti: args.refreshJti,
      userId: args.userId,
      familyId: args.familyId,
      expiresAt,
      userAgentHash: args.meta.userAgent ? this.tokenService.hashToken(args.meta.userAgent) : null,
      ipHash: args.meta.ip ? this.tokenService.hashToken(args.meta.ip) : null,
    });
  }

  private parseTtlToMs(ttl: string): number {
    const num = parseInt(ttl.slice(0, -1));
    const unit = ttl.slice(-1).toLowerCase();
    switch (unit) {
      case 'd': return num * 24 * 60 * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'm': return num * 60 * 1000;
      default: return num;
    }
  }

  private async buildAuthUser(userId: string): Promise<AuthUserPayload> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError('User not found');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: [user.role],
      permissions: [],
    };
  }
}
