import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export type SignedTokens = {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
};

export type TokenPayload = Omit<JwtPayload, 'type'>;

export interface TokenServicePort {
  signTokens(payload: TokenPayload): Promise<SignedTokens>;
  verifyRefreshToken(token: string): Promise<JwtPayload & { jti?: string }>;
  hashToken(token: string): string;
}
