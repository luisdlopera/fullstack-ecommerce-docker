import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { createHash } from 'node:crypto';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
  ) {}

  async execute(token: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
    const tokenHash = this.hashResetToken(token);
    const resetToken = await this.authRepository.findPasswordResetToken(tokenHash);

    if (
      !resetToken ||
      resetToken.usedAt ||
      (resetToken.expiresAt && resetToken.expiresAt <= new Date()) ||
      !resetToken.user?.isActive
    ) {
      throw new UnauthorizedException(AuthMessages.INVALID_TOKEN);
    }

    await this.authRepository.completePasswordReset(
      resetToken.userId,
      resetToken.id,
      bcryptjs.hashSync(newPassword, 10),
    );

    return { ok: true, message: AuthMessages.PASSWORD_RESET_SUCCESSFUL };
  }

  private hashResetToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
