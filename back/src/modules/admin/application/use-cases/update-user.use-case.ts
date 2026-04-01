import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from '../admin.service';
import { UpdateUserDto } from '../../infrastructure/http/dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(userId: string, dto: UpdateUserDto, actorRole?: Role) {
    return this.adminService.updateUser(userId, dto, actorRole);
  }
}
