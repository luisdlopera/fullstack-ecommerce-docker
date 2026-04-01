import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';

@Injectable()
export class DeleteMyAddressByIdUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, addressId: string) {
    const deletedCount = await this.usersRepository.deleteAddressById(userId, addressId);
    if (deletedCount === 0) throw new NotFoundException('Address not found');
    return { ok: true };
  }
}
