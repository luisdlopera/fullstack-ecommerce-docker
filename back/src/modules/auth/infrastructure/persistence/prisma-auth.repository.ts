import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  AuthRepositoryPort,
  AuthUserRecord,
  AuthUserSummary,
  CreateEmailVerificationTokenInput,
  CreatePasswordResetTokenInput,
  CreateRefreshTokenInput,
  CreateUserInput,
  EmailVerificationRecord,
  PasswordResetRecord,
  RefreshTokenRecord,
  UpdateRefreshTokenInput,
} from '../../domain/ports/auth-repository.port';

@Injectable()
export class PrismaAuthRepository implements AuthRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });
  }

  async findUserById(userId: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });
  }

  async createUser(input: CreateUserInput): Promise<AuthUserSummary> {
    return this.prisma.user.create({
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    });
  }

  async updateUser(userId: string, data: Partial<AuthUserRecord>): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateUserLastLogin(userId: string, at: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: at },
    });
  }

  async listRolePermissions(role: Role): Promise<string[]> {
    const rows = await this.prisma.rolePermission.findMany({
      where: { role },
      select: { permissionId: true },
      orderBy: { permissionId: 'asc' },
    });
    return rows.map((item) => item.permissionId);
  }

  async issueEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.updateMany({
        where: { userId: input.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.create({ data: input }),
    ]);
  }

  async findEmailVerificationToken(tokenHash: string): Promise<EmailVerificationRecord | null> {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, isActive: true } } },
    });
  }

  async completeEmailVerification(userId: string, tokenId: string, verifiedAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: verifiedAt },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.updateMany({
        where: { userId, usedAt: null, id: { not: tokenId } },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async createPasswordResetToken(input: CreatePasswordResetTokenInput): Promise<void> {
    await this.prisma.passwordResetToken.create({ data: input });
  }

  async findPasswordResetToken(tokenHash: string): Promise<PasswordResetRecord | null> {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, isActive: true } } },
    });
  }

  async completePasswordReset(userId: string, tokenId: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<void> {
    await this.prisma.refreshToken.create({ data: input });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async findRefreshTokenByToken(token: string): Promise<RefreshTokenRecord | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  async updateRefreshToken(refreshTokenId: string, data: UpdateRefreshTokenInput): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenId },
      data,
    });
  }

  async rotateRefreshToken(input: {
    currentTokenId: string;
    update: UpdateRefreshTokenInput;
    next: CreateRefreshTokenInput;
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: input.currentTokenId },
        data: input.update,
      }),
      this.prisma.refreshToken.create({
        data: input.next,
      }),
    ]);
  }

  async revokeRefreshTokensByUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshTokensByFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshTokensByHash(userId: string, tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null, tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeRefreshTokensByToken(userId: string, token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null, token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeExpiredRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, expiresAt: { lt: new Date() }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
