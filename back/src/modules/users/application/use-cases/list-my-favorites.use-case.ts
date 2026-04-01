import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { mapFavorite } from './users.helpers';

@Injectable()
export class ListMyFavoritesUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string) {
    const favorites = await this.usersRepository.listFavorites(userId);
    return favorites.map(mapFavorite);
  }
}
