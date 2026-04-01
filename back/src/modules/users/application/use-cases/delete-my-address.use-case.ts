import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';

@Injectable()
export class DeleteMyAddressUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string) {
    const address = await this.usersRepository.findLatestAddress(userId);
    if (!address) return { ok: true };

    await this.usersRepository.deleteAddress(address.id);
    return { ok: true };
  }
}
