import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '../../domain/ports/users-repository.port';
import { UpsertAddressDto } from '../../infrastructure/http/dto/upsert-address.dto';

@Injectable()
export class UpdateMyAddressUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepositoryPort) {}

  async execute(userId: string, addressId: string, dto: UpsertAddressDto) {
    const country = await this.usersRepository.findCountryById(dto.countryId);
    if (!country) throw new NotFoundException('Country not found');

    const existing = await this.usersRepository.findAddressById(userId, addressId);
    if (!existing) throw new NotFoundException('Address not found');

    return this.usersRepository.updateAddress(existing.id, dto);
  }
}
