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
    console.log('[LOGIN USE CASE] ============================================');
    console.log('[LOGIN USE CASE] Starting login execution for:', input.email);
    
    try {
      const normalizedEmail = this.normalizeEmail(input.email);
      console.log('[LOGIN USE CASE] Normalized email:', normalizedEmail);
      
      console.log('[LOGIN USE CASE] Looking up user by email...');
      const user = await this.authRepository.findUserByEmail(normalizedEmail);
      console.log('[LOGIN USE CASE] User lookup result:', user ? 'FOUND' : 'NOT FOUND');
      
      if (!user) {
        console.log('[LOGIN USE CASE] User not found, throwing UnauthorizedError');
        throw new UnauthorizedError('Invalid email or password');
      }
      
      console.log('[LOGIN USE CASE] User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled,
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
      });

      console.log('[LOGIN USE CASE] Comparing passwords...');
      const passwordMatch = bcryptjs.compareSync(input.password, user.password);
      console.log('[LOGIN USE CASE] Password comparison result:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('[LOGIN USE CASE] Password mismatch, throwing UnauthorizedError');
        throw new UnauthorizedError('Invalid email or password');
      }

      if (!user.isActive) {
        console.log('[LOGIN USE CASE] Account deactivated, throwing UnauthorizedError');
        throw new UnauthorizedError('Account is deactivated');
      }

      if (!user.emailVerified) {
        console.log('[LOGIN USE CASE] Email not verified, throwing UnauthorizedError');
        throw new UnauthorizedError('Email address is not verified');
      }

      if (user.mfaEnabled && this.isPrivilegedRole(user.role)) {
        console.log('[LOGIN USE CASE] MFA required for privileged role');
        if (!input.mfaCode) {
          console.log('[LOGIN USE CASE] MFA code missing, throwing UnauthorizedError');
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
        console.log('[LOGIN USE CASE] MFA code validation:', validMfaCode);
        if (!validMfaCode) {
          console.log('[LOGIN USE CASE] Invalid MFA code, throwing UnauthorizedError');
          throw new UnauthorizedError('Invalid MFA code');
        }
      }

      console.log('[LOGIN USE CASE] All validations passed, updating last login...');
      await this.authRepository.updateUserLastLogin(user.id, new Date());
      console.log('[LOGIN USE CASE] Last login updated');

      const familyId = randomUUID();
      console.log('[LOGIN USE CASE] Generated familyId:', familyId);
      
      console.log('[LOGIN USE CASE] Generating tokens...');
      const tokens = await this.tokenService.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
      console.log('[LOGIN USE CASE] Tokens generated:', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        hasRefreshJti: !!tokens.refreshJti,
      });

      console.log('[LOGIN USE CASE] Storing refresh token...');
      await this.storeRefreshToken({
        userId: user.id,
        refreshToken: tokens.refreshToken,
        refreshJti: tokens.refreshJti,
        familyId,
        meta: clientMeta,
      });
      console.log('[LOGIN USE CASE] Refresh token stored');

      console.log('[LOGIN USE CASE] Building auth user payload...');
      const authUser = await this.buildAuthUser(user.id);
      console.log('[LOGIN USE CASE] Auth user built:', authUser.email);
      
      console.log('[LOGIN USE CASE] Login successful, returning result');
      console.log('[LOGIN USE CASE] ============================================');

      return {
        user: authUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('[LOGIN USE CASE] ERROR during login execution:', error);
      console.error('[LOGIN USE CASE] Error type:', error?.constructor?.name);
      console.error('[LOGIN USE CASE] Error message:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.stack) {
        console.error('[LOGIN USE CASE] Stack trace:', error.stack);
      }
      console.error('[LOGIN USE CASE] ============================================');
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
