import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { UpsertCountryDto } from '../../infrastructure/http/dto/upsert-country.dto';

@Injectable()
export class CreateCountryUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(dto: UpsertCountryDto) {
    return this.adminService.createCountry(dto);
  }
}
