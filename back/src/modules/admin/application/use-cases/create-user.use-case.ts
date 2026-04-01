import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from '../admin.service';
import { CreateUserDto } from '../../infrastructure/http/dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(dto: CreateUserDto, actorRole?: Role) {
    return this.adminService.createUser(dto, actorRole);
  }
}
