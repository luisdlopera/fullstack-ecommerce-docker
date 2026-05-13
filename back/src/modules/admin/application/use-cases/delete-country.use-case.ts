import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_COUNTRY_REPOSITORY, type AdminCountryRepositoryPort } from '../../domain/ports/admin-country.repository.port';
import { BadRequestError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class DeleteCountryUseCase {
  constructor(
    @Inject(ADMIN_COUNTRY_REPOSITORY) private readonly countryRepository: AdminCountryRepositoryPort,
  ) {}

  async execute(countryId: string) {
    const addressCount = await this.countryRepository.countUserAddresses(countryId);
    const orderAddressCount = await this.countryRepository.countOrderAddresses(countryId);

    if (addressCount > 0 || orderAddressCount > 0) {
      throw new BadRequestError('Cannot delete country with associated addresses');
    }

    await this.countryRepository.delete(countryId);
    return { ok: true };
  }
}
