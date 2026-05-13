import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ADMIN_USER_REPOSITORY, type AdminUserRepositoryPort } from '../../domain/ports/admin-user.repository.port';
import { NotFoundError, ForbiddenError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
  ) {}

  async execute(userId: string, actorRole?: Role) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (actorRole === Role.SUPPORT && user.role !== Role.CUSTOMER) {
      throw new ForbiddenError('Support can only access customers');
    }

    return user;
  }
}
