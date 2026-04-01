import { Role } from '@prisma/client';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export type AuthUserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  emailVerified: Date | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
};

export type AuthUserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: Date | null;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  token: string | null;
  tokenHash: string | null;
  jti: string | null;
  familyId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  replacedByJti: string | null;
};

export type EmailVerificationRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: { id: string; isActive: boolean } | null;
};

export type PasswordResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: { id: string; isActive: boolean } | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type CreateEmailVerificationTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type CreatePasswordResetTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type CreateRefreshTokenInput = {
  userId: string;
  token: string;
  tokenHash: string;
  jti: string;
  familyId: string;
  expiresAt: Date;
  userAgentHash: string | null;
  ipHash: string | null;
};

export type UpdateRefreshTokenInput = {
  revokedAt?: Date;
  replacedByJti?: string | null;
  lastUsedAt?: Date;
  familyId?: string | null;
};

export interface AuthRepositoryPort {
  findUserByEmail(email: string): Promise<AuthUserRecord | null>;
  findUserById(userId: string): Promise<AuthUserRecord | null>;
  createUser(input: CreateUserInput): Promise<AuthUserSummary>;
  updateUser(userId: string, data: Partial<AuthUserRecord>): Promise<void>;
  updateUserLastLogin(userId: string, at: Date): Promise<void>;
  listRolePermissions(role: Role): Promise<string[]>;

  issueEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<void>;
  findEmailVerificationToken(tokenHash: string): Promise<EmailVerificationRecord | null>;
  completeEmailVerification(userId: string, tokenId: string, verifiedAt: Date): Promise<void>;

  createPasswordResetToken(input: CreatePasswordResetTokenInput): Promise<void>;
  findPasswordResetToken(tokenHash: string): Promise<PasswordResetRecord | null>;
  completePasswordReset(userId: string, tokenId: string, passwordHash: string): Promise<void>;

  createRefreshToken(input: CreateRefreshTokenInput): Promise<void>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  findRefreshTokenByToken(token: string): Promise<RefreshTokenRecord | null>;
  updateRefreshToken(refreshTokenId: string, data: UpdateRefreshTokenInput): Promise<void>;
  rotateRefreshToken(input: {
    currentTokenId: string;
    update: UpdateRefreshTokenInput;
    next: CreateRefreshTokenInput;
  }): Promise<void>;
  revokeRefreshTokensByUser(userId: string): Promise<void>;
  revokeRefreshTokensByFamily(familyId: string): Promise<void>;
  revokeRefreshTokensByHash(userId: string, tokenHash: string): Promise<void>;
  revokeRefreshTokensByToken(userId: string, token: string): Promise<void>;
  revokeExpiredRefreshTokens(userId: string): Promise<void>;
}
