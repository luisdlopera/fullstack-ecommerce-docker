import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { UpsertAddressDto } from '../../infrastructure/http/dto/upsert-address.dto';

@Injectable()
export class UpsertMyAddressUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, dto: UpsertAddressDto) {
    const country = await this.usersRepository.findCountryById(dto.countryId);
    if (!country) throw new NotFoundException('Country not found');

    const existing = await this.usersRepository.findLatestAddress(userId);
    if (existing) {
      return this.usersRepository.updateAddress(existing.id, dto);
    }

    return this.usersRepository.createAddress(userId, dto);
  }
}
