import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import speakeasy from 'speakeasy';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../../domain/ports/token-service.port';
import { LoginDto } from '../../infrastructure/http/dto/login.dto';
import { UnauthorizedError } from '../../../../shared/domain/errors/domain-error';
import { authDebugLog } from '../../../../shared/infrastructure/observability/auth-debug';

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
    authDebugLog('[AUTH-BACK] login use-case start', {
      email: normalizedEmail,
      passwordLength: input.password ? input.password.length : 0,
      hasMfaCode: Boolean(input.mfaCode),
      clientIp: clientMeta.ip,
      hasUserAgent: Boolean(clientMeta.userAgent),
    });
    const user = await this.authRepository.findUserByEmail(normalizedEmail);

    let isPasswordValid = false;
    if (!user) {
      authDebugLog('[AUTH-BACK] user lookup', { email: normalizedEmail, found: false });
      // Prevent timing attacks by hashing a static string
      await bcryptjs.compare(input.password, '$2b$10$SqIc.G0yJs8nKnrwEouZWuNzIm0iFNSh540EE53nvhmwZw/z9sPaa');
      throw new UnauthorizedError('Invalid email or password');
    }

    authDebugLog('[AUTH-BACK] user lookup', {
      email: normalizedEmail,
      found: true,
      userId: user.id,
      role: user.role,
      isActive: user.isActive,
      emailVerified: Boolean(user.emailVerified),
      mfaEnabled: user.mfaEnabled,
    });

    isPasswordValid = await bcryptjs.compare(input.password, user.password);
    if (!isPasswordValid) {
      authDebugLog('[AUTH-BACK] password check', { userId: user.id, ok: false });
      throw new UnauthorizedError('Invalid email or password');
    }

    authDebugLog('[AUTH-BACK] password check', { userId: user.id, ok: true });

    if (!user.isActive) {
      authDebugLog('[AUTH-BACK] user blocked', { userId: user.id, reason: 'inactive' });
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.emailVerified) {
      authDebugLog('[AUTH-BACK] user blocked', { userId: user.id, reason: 'email_unverified' });
      throw new UnauthorizedError('Email address is not verified');
    }

    if (user.mfaEnabled) {
      if (!input.mfaCode) {
        authDebugLog('[AUTH-BACK] mfa required', { userId: user.id, provided: false });
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
        authDebugLog('[AUTH-BACK] mfa check', { userId: user.id, ok: false });
        throw new UnauthorizedError('Invalid MFA code');
      }

      authDebugLog('[AUTH-BACK] mfa check', { userId: user.id, ok: true });
    }

    await this.authRepository.updateUserLastLogin(user.id, new Date());

    const familyId = randomUUID();
    const tokens = await this.tokenService.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    authDebugLog('[AUTH-BACK] tokens issued', {
      userId: user.id,
      hasAccessToken: Boolean(tokens.accessToken),
      accessTokenLength: tokens.accessToken ? tokens.accessToken.length : 0,
      hasRefreshToken: Boolean(tokens.refreshToken),
      refreshTokenLength: tokens.refreshToken ? tokens.refreshToken.length : 0,
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
