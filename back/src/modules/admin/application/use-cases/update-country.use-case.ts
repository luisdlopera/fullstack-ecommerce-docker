import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { UpsertCountryDto } from '../../infrastructure/http/dto/upsert-country.dto';

@Injectable()
export class UpdateCountryUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(countryId: string, dto: Partial<UpsertCountryDto>) {
    return this.adminService.updateCountry(countryId, dto);
  }
}
