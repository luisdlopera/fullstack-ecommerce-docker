import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class GetUserByIdUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(userId: string, actorRole?: Role) {
    return this.adminService.getUserById(userId, actorRole);
  }
}
