import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import speakeasy from 'speakeasy';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';

@Injectable()
export class EnrollMfaUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
  ) {}

  async execute(userId: string): Promise<{ ok: boolean; secret: string; otpauthUrl: string }> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) throw new UnauthorizedException(AuthMessages.USER_NOT_FOUND);
    if (!this.isPrivilegedRole(user.role)) {
      throw new ForbiddenException(AuthMessages.MFA_NOT_ENROLLED);
    }

    const generated = speakeasy.generateSecret({
      issuer: 'NexStore',
      name: user.email,
      length: 20,
    });
    const secret = generated.base32;
    const otpauthUrl = generated.otpauth_url;

    if (!secret || !otpauthUrl) {
      throw new UnauthorizedException(AuthMessages.INTERNAL_SERVER_ERROR);
    }

    await this.authRepository.updateUser(userId, { mfaSecret: secret, mfaEnabled: false });

    return { ok: true, secret, otpauthUrl };
  }

  private isPrivilegedRole(role: Role): boolean {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }
}
