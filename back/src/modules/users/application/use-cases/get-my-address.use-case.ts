import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';

@Injectable()
export class GetMyAddressUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  execute(userId: string) {
    return this.usersRepository.findLatestAddress(userId);
  }
}
