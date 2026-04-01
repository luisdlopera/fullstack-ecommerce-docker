import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { mapFavorite } from './users.helpers';

@Injectable()
export class AddMyFavoriteUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, productId: string) {
    const product = await this.usersRepository.findActiveProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.usersRepository.upsertFavorite(userId, productId);
    const favorites = await this.usersRepository.listFavorites(userId);
    return favorites.map(mapFavorite);
  }
}
