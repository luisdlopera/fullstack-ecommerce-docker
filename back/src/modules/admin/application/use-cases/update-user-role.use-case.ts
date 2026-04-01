import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from '../admin.service';
import { UpdateUserRoleDto } from '../../infrastructure/http/dto/update-user-role.dto';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(userId: string, dto: UpdateUserRoleDto, actorId: string, actorRole: Role) {
    return this.adminService.updateUserRole(userId, dto, actorId, actorRole);
  }
}
