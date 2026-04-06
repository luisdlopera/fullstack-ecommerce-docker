import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import speakeasy from 'speakeasy';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../../domain/ports/token-service.port';
import { LoginDto } from '../../infrastructure/http/dto/login.dto';
import { UnauthorizedError } from '../../../../shared/domain/errors/domain-error';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';
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
    authDebugLog('[AUTH-BACK] login use-case start', {
      email: input.email,
      passwordLength: input.password ? input.password.length : 0,
      hasMfaCode: Boolean(input.mfaCode),
      clientIp: clientMeta.ip,
      hasUserAgent: Boolean(clientMeta.userAgent),
    });

    try {
      const normalizedEmail = this.normalizeEmail(input.email);
      authDebugLog('[AUTH-BACK] email normalized', { email: normalizedEmail });

      authDebugLog('[AUTH-BACK] Looking up user by email...', { email: normalizedEmail });
      const user = await this.authRepository.findUserByEmail(normalizedEmail);
      authDebugLog('[AUTH-BACK] User lookup result', { found: !!user });

      if (!user) {
        authDebugLog('[AUTH-BACK] User not found', { email: normalizedEmail });
        // Prevent timing attacks by hashing a static string
        await bcryptjs.compare(input.password, '$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhashdummyha');
        throw new UnauthorizedError(AuthMessages.INVALID_CREDENTIALS);
      }

      authDebugLog('[AUTH-BACK] User found', {
        userId: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
      });

      authDebugLog('[AUTH-BACK] Comparing passwords...', { userId: user.id });
      const isPasswordValid = await bcryptjs.compare(input.password, user.password);
      authDebugLog('[AUTH-BACK] Password comparison result', { userId: user.id, ok: isPasswordValid });

      if (!isPasswordValid) {
        authDebugLog('[AUTH-BACK] Password mismatch', { userId: user.id });
        throw new UnauthorizedError(AuthMessages.INVALID_CREDENTIALS);
      }

      if (!user.isActive) {
        authDebugLog('[AUTH-BACK] Account deactivated', { userId: user.id });
        throw new UnauthorizedError(AuthMessages.USER_INACTIVE);
      }

      if (!user.emailVerified) {
        authDebugLog('[AUTH-BACK] Email not verified', { userId: user.id });
        throw new UnauthorizedError(AuthMessages.EMAIL_NOT_VERIFIED);
      }

      if (user.mfaEnabled) {
        authDebugLog('[AUTH-BACK] MFA required for user', { userId: user.id, role: user.role });
        if (!input.mfaCode) {
          authDebugLog('[AUTH-BACK] MFA code missing', { userId: user.id });
          throw new UnauthorizedError(AuthMessages.MFA_REQUIRED);
        }
        const validMfaCode =
          !!user.mfaSecret &&
          speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: input.mfaCode,
            window: 1,
          });
        authDebugLog('[AUTH-BACK] MFA code validation', { userId: user.id, ok: validMfaCode });
        if (!validMfaCode) {
          authDebugLog('[AUTH-BACK] Invalid MFA code', { userId: user.id });
          throw new UnauthorizedError(AuthMessages.MFA_INVALID);
        }
      }

      authDebugLog('[AUTH-BACK] All validations passed, updating last login...', { userId: user.id });
      await this.authRepository.updateUserLastLogin(user.id, new Date());
      authDebugLog('[AUTH-BACK] Last login updated', { userId: user.id });

      const familyId = randomUUID();
      authDebugLog('[AUTH-BACK] Generated familyId', { userId: user.id, familyId });

      authDebugLog('[AUTH-BACK] Generating tokens...', { userId: user.id });
      const tokens = await this.tokenService.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      authDebugLog('[AUTH-BACK] Tokens generated', {
        userId: user.id,
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        hasRefreshJti: !!tokens.refreshJti,
      });

      authDebugLog('[AUTH-BACK] Storing refresh token...', { userId: user.id });
      await this.storeRefreshToken({
        userId: user.id,
        refreshToken: tokens.refreshToken,
        refreshJti: tokens.refreshJti,
        familyId,
        meta: clientMeta,
      });
      authDebugLog('[AUTH-BACK] Refresh token stored', { userId: user.id });

      authDebugLog('[AUTH-BACK] Building auth user payload...', { userId: user.id });
      const authUser = await this.buildAuthUser(user.id);
      authDebugLog('[AUTH-BACK] Auth user built', { userId: user.id, email: authUser.email });
      authDebugLog('[AUTH-BACK] Login successful', { userId: user.id });

      return {
        user: authUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      authDebugLog('[AUTH-BACK] ERROR during login execution', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
      });
      throw error;
    }
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
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'm':
        return num * 60 * 1000;
      default:
        return num;
    }
  }

  private async buildAuthUser(userId: string): Promise<AuthUserPayload> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError(AuthMessages.USER_NOT_FOUND);

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
