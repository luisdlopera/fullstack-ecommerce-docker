import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ADMIN_USER_REPOSITORY, type AdminUserRepositoryPort } from '../../domain/ports/admin-user.repository.port';
import { ADMIN_AUDIT_REPOSITORY, type AdminAuditRepositoryPort } from '../../domain/ports/admin-audit.repository.port';
import { UpdateUserRoleDto } from '../../infrastructure/http/dto/update-user-role.dto';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
    @Inject(ADMIN_AUDIT_REPOSITORY) private readonly auditRepository: AdminAuditRepositoryPort,
  ) {}

  async execute(userId: string, dto: UpdateUserRoleDto, actorId: string, actorRole: Role) {
    if (userId === actorId) {
      throw new BadRequestError('You cannot change your own role');
    }

    await this.assertCanManageTargetUser(userId, actorRole);

    if (actorRole === Role.ADMIN && dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('ADMIN cannot assign SUPER_ADMIN role');
    }

    const updated = await this.userRepository.updateRole(userId, dto.role);
    if (!updated) throw new NotFoundError('User not found');

    await this.auditRepository.create({
      actorId,
      action: 'user.role.changed',
      entityType: 'user',
      entityId: userId,
      metadata: { nextRole: dto.role },
    });

    return updated;
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
