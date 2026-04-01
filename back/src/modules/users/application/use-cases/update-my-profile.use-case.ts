import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { UpdateProfileDto } from '../../infrastructure/http/dto/update-profile.dto';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  execute(userId: string, dto: UpdateProfileDto) {
    const phone = dto.phone && dto.phone.trim().length > 0 ? dto.phone : null;
    const image = dto.image && dto.image.trim().length > 0 ? dto.image : null;

    return this.usersRepository.updateUserProfile(userId, {
      name: dto.name,
      phone,
      image,
    });
  }
}
