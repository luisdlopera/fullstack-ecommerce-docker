import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_COUNTRY_REPOSITORY, type AdminCountryRepositoryPort } from '../../domain/ports/admin-country.repository.port';
import { UpsertCountryDto } from '../../infrastructure/http/dto/upsert-country.dto';
import { ConflictError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class CreateCountryUseCase {
  constructor(
    @Inject(ADMIN_COUNTRY_REPOSITORY) private readonly countryRepository: AdminCountryRepositoryPort,
  ) {}

  async execute(dto: UpsertCountryDto) {
    const existing = await this.countryRepository.findById(dto.id);
    if (existing) throw new ConflictError('Country ID already exists');

    return this.countryRepository.create({
      id: dto.id,
      name: dto.name,
      isoCode: dto.isoCode,
      currency: dto.currency ?? 'USD',
      isActive: dto.isActive ?? true,
      allowsShipping: dto.allowsShipping ?? true,
      allowsPurchase: dto.allowsPurchase ?? true,
      shippingBaseCost: dto.shippingBaseCost ?? 0,
      etaDays: dto.etaDays ?? 7,
      priority: dto.priority ?? 0,
    });
  }
}
