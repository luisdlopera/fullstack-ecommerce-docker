import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { ChangePasswordDto } from '../../infrastructure/http/dto/change-password.dto';

@Injectable()
export class ChangeMyPasswordUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.usersRepository.findUserPassword(userId);
    if (!user) throw new NotFoundException('User not found');

    const matches = bcryptjs.compareSync(dto.currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is invalid');
    }

    await this.usersRepository.updateUserPassword(userId, bcryptjs.hashSync(dto.newPassword, 10));
    return { ok: true };
  }
}
