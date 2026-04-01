import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetCountriesUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute() {
    return this.adminService.getCountries();
  }
}
