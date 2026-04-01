import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';

@Injectable()
export class RemoveMyFavoriteUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, productId: string) {
    await this.usersRepository.deleteFavorite(userId, productId);
    return { ok: true };
  }
}
