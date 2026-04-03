import { Inject, Injectable } from '@nestjs/common';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { TOKEN_SERVICE, type TokenServicePort } from '../../domain/ports/token-service.port';
import { AuthUserPayload, ClientMeta } from './login.use-case';
import { randomUUID } from 'node:crypto';
import { UnauthorizedError } from '../../../../shared/domain/errors/domain-error';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(refreshToken: string, clientMeta: ClientMeta = {}) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedError(AuthMessages.INVALID_TOKEN_TYPE);
      }

      const tokenHash = this.tokenService.hashToken(refreshToken);
      let stored = await this.authRepository.findRefreshTokenByHash(tokenHash);

      if (!stored) {
        stored = await this.authRepository.findRefreshTokenByToken(refreshToken);
      }

      if (!stored) {
        throw new UnauthorizedError(AuthMessages.SESSION_EXPIRED);
      }

      if (stored.revokedAt) {
        if (stored.familyId) {
          await this.authRepository.revokeRefreshTokensByFamily(stored.familyId);
        }
        throw new UnauthorizedError(AuthMessages.TOKEN_REUSE_DETECTED);
      }

      if (stored.expiresAt < new Date()) {
        await this.authRepository.updateRefreshToken(stored.id, { revokedAt: new Date() });
        throw new UnauthorizedError(AuthMessages.SESSION_EXPIRED);
      }

      const user = await this.authRepository.findUserById(payload.sub);
      if (!user) throw new UnauthorizedError(AuthMessages.USER_NOT_FOUND);
      if (!user.isActive || !user.emailVerified) {
        throw new UnauthorizedError(AuthMessages.UNAUTHORIZED);
      }

      const tokens = await this.tokenService.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      const familyId = stored.familyId || randomUUID();

      await this.authRepository.rotateRefreshToken({
        currentTokenId: stored.id,
        update: { revokedAt: new Date(), replacedByJti: tokens.refreshJti, lastUsedAt: new Date(), familyId },
        next: {
          tokenHash: this.tokenService.hashToken(tokens.refreshToken),
          jti: tokens.refreshJti,
          token: tokens.refreshToken,
          familyId,
          userId: user.id,
          expiresAt: new Date(Date.now() + this.parseTtlToMs(process.env.JWT_REFRESH_TTL ?? '7d')),
          userAgentHash: clientMeta.userAgent ? this.tokenService.hashToken(clientMeta.userAgent) : null,
          ipHash: clientMeta.ip ? this.tokenService.hashToken(clientMeta.ip) : null,
        },
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: await this.buildAuthUser(user.id),
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError(AuthMessages.SESSION_EXPIRED);
    }
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
