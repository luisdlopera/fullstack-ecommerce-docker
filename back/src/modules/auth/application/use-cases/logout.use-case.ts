import { Inject, Injectable } from '@nestjs/common';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { hashValue } from '../../../../shared/domain/utils/auth.utils';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
  ) {}

  async execute(userId: string, refreshToken?: string): Promise<{ ok: boolean }> {
    if (refreshToken) {
      const tokenHash = hashValue(refreshToken);
      await this.authRepository.revokeRefreshTokensByHash(userId, tokenHash);
      await this.authRepository.revokeRefreshTokensByToken(userId, refreshToken);
    } else {
      await this.authRepository.revokeRefreshTokensByUser(userId);
    }
    return { ok: true };
  }
}
