import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID, createHash } from 'node:crypto';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import type { SignedTokens, TokenPayload, TokenServicePort } from '../../domain/ports/token-service.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async signTokens(payload: TokenPayload): Promise<SignedTokens> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException(AuthMessages.JWT_SECRET_MISSING);

    const accessPayload: JwtPayload = { ...payload, type: 'access' };
    const refreshPayload: JwtPayload = { ...payload, type: 'refresh' };

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

  async verifyRefreshToken(token: string): Promise<JwtPayload & { jti?: string }> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException(AuthMessages.JWT_SECRET_MISSING);
    return this.jwtService.verifyAsync(token, { secret });
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
