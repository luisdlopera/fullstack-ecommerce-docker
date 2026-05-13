import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { ADMIN_USER_REPOSITORY, type AdminUserRepositoryPort } from '../../domain/ports/admin-user.repository.port';
import { CreateUserDto } from '../../infrastructure/http/dto/create-user.dto';
import { ConflictError, ForbiddenError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY) private readonly userRepository: AdminUserRepositoryPort,
  ) {}

  async execute(dto: CreateUserDto, actorRole?: Role) {
    if (actorRole === Role.ADMIN && dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('ADMIN cannot manage SUPER_ADMIN users');
    }

    const email = dto.email.toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email is already in use');

    return this.userRepository.create({
      name: dto.name,
      email,
      passwordHash: bcryptjs.hashSync(dto.password, 10),
      phone: dto.phone,
      role: dto.role ?? Role.CUSTOMER,
    });
  }
}
