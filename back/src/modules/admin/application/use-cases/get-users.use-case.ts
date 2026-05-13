import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ADMIN_USER_REPOSITORY, type AdminUserRepositoryPort } from '../../domain/ports/admin-user.repository.port';

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
    search?: string,
    role?: Role,
    isActive?: boolean,
    actorRole?: Role,
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const { data, total } = await this.userRepository.list({
      page: safePage,
      limit: safeLimit,
      search,
      role,
      isActive,
      actorRole,
    });

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }
}
