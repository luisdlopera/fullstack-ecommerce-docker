import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ADMIN_USER_REPOSITORY, type AdminUserRepositoryPort } from '../../domain/ports/admin-user.repository.port';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
  ) {}

  async execute(userId: string, isActive: boolean, actorId: string, actorRole: Role) {
    if (userId === actorId) {
      throw new BadRequestError('You cannot change your own status');
    }

    await this.assertCanManageTargetUser(userId, actorRole);

    return this.userRepository.updateStatus(userId, isActive);
  }

  private async assertCanManageTargetUser(targetUserId: string, actorRole?: Role) {
    if (!actorRole) return;
    if (actorRole === Role.SUPER_ADMIN) return;

    const target = await this.userRepository.findByIdWithRole(targetUserId);

    if (!target) {
      throw new NotFoundError('User not found');
    }

    if (actorRole === Role.ADMIN && target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('ADMIN cannot manage SUPER_ADMIN users');
    }
  }
}
