import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_COUNTRY_REPOSITORY, type AdminCountryRepositoryPort } from '../../domain/ports/admin-country.repository.port';

@Injectable()
export class GetCountriesUseCase {
  constructor(
    @Inject(ADMIN_COUNTRY_REPOSITORY) private readonly countryRepository: AdminCountryRepositoryPort,
  ) {}

  execute() {
    return this.countryRepository.list();
  }
}
