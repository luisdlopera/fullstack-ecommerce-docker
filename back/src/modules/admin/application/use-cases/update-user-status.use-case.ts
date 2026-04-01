import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(userId: string, isActive: boolean, actorId: string, actorRole: Role) {
    return this.adminService.updateUserStatus(userId, isActive, actorId, actorRole);
  }
}
