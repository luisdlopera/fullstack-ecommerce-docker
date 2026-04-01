import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class GetUsersUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(
    page?: number,
    limit?: number,
    search?: string,
    role?: Role,
    isActive?: boolean,
    actorRole?: Role,
  ) {
    return this.adminService.getUsers(page, limit, search, role, isActive, actorRole);
  }
}
