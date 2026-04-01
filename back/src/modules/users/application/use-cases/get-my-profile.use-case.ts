import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';

@Injectable()
export class GetMyProfileUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string) {
    const user = await this.usersRepository.findUserProfile(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
