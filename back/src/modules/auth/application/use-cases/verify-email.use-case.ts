import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';
import { hashValue } from '../../../../shared/domain/utils/auth.utils';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
  ) {}

  async execute(token: string): Promise<{ ok: boolean; message: string }> {
    const tokenHash = hashValue(token);
    const verification = await this.authRepository.findEmailVerificationToken(tokenHash);

    if (
      !verification ||
      verification.usedAt ||
      (verification.expiresAt && verification.expiresAt <= new Date()) ||
      !verification.user?.isActive
    ) {
      throw new UnauthorizedException(AuthMessages.INVALID_TOKEN);
    }

    await this.authRepository.completeEmailVerification(verification.userId, verification.id, new Date());

    return { ok: true, message: AuthMessages.EMAIL_VERIFICATION_SUCCESSFUL };
  }
}
