import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { buildPaginationMeta, normalizePagination } from './users.helpers';

@Injectable()
export class ListMyAddressesUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, page?: number, limit?: number) {
    const pagination = normalizePagination(page, limit);
    const [total, addresses] = await Promise.all([
      this.usersRepository.countAddresses(userId),
      this.usersRepository.listAddresses(userId, pagination.skip, pagination.limit),
    ]);

    return {
      data: addresses,
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }
}
