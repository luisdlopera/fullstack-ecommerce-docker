import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class DeleteCountryUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(countryId: string) {
    return this.adminService.deleteCountry(countryId);
  }
}
