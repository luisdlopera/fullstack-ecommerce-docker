import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { buildPaginationMeta, mapFavorite, normalizePagination } from './users.helpers';

@Injectable()
export class ListMyFavoritesPaginatedUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, page?: number, limit?: number) {
    const pagination = normalizePagination(page, limit);
    const [total, favorites] = await Promise.all([
      this.usersRepository.countFavorites(userId),
      this.usersRepository.listFavoritesPaginated(userId, pagination.skip, pagination.limit),
    ]);

    return {
      data: favorites.map(mapFavorite),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }
}
