import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class DeleteUserUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(userId: string, actorId: string, actorRole: Role) {
    return this.adminService.deleteUser(userId, actorId, actorRole);
  }
}
