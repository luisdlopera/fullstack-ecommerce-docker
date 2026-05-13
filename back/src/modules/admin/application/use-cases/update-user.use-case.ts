import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_USER_REPOSITORY, type AdminUserRepositoryPort } from '../../domain/ports/admin-user.repository.port';
import { UpdateUserDto } from '../../infrastructure/http/dto/update-user.dto';
import { ConflictError, NotFoundError, ForbiddenError } from '../../../../shared/domain/errors/domain-error';
import { Role } from '@prisma/client';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
  ) {}

  async execute(userId: string, dto: UpdateUserDto, actorRole?: Role) {
    await this.assertCanManageTargetUser(userId, actorRole);

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== userId) throw new ConflictError('Email is already in use');
    }

    return this.userRepository.update(userId, {
      name: dto.name,
      email: dto.email?.toLowerCase(),
      phone: dto.phone,
      isActive: dto.isActive,
    });
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
