import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import speakeasy from 'speakeasy';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';

@Injectable()
export class VerifyMfaUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
  ) {}

  async execute(userId: string, code: string): Promise<{ ok: boolean }> {
    const user = await this.authRepository.findUserById(userId);

    const validCode =
      !!user?.mfaSecret &&
      speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 1,
      });

    if (!validCode) {
      throw new UnauthorizedException(AuthMessages.MFA_INVALID);
    }

    await this.authRepository.updateUser(userId, { mfaEnabled: true });

    return { ok: true };
  }
}
