import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_COUNTRY_REPOSITORY, type AdminCountryRepositoryPort } from '../../domain/ports/admin-country.repository.port';
import { UpsertCountryDto } from '../../infrastructure/http/dto/upsert-country.dto';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class UpdateCountryUseCase {
  constructor(
    @Inject(ADMIN_COUNTRY_REPOSITORY) private readonly countryRepository: AdminCountryRepositoryPort,
  ) {}

  async execute(countryId: string, dto: Partial<UpsertCountryDto>) {
    const existing = await this.countryRepository.findById(countryId);
    if (!existing) throw new NotFoundError('Country not found');

    return this.countryRepository.update(countryId, {
      name: dto.name,
      isoCode: dto.isoCode,
      currency: dto.currency,
      isActive: dto.isActive,
      allowsShipping: dto.allowsShipping,
      allowsPurchase: dto.allowsPurchase,
      shippingBaseCost: dto.shippingBaseCost,
      etaDays: dto.etaDays,
      priority: dto.priority,
    });
  }
}
