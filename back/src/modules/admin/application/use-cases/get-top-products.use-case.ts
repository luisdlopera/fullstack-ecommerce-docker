import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetTopProductsUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(limit?: number) {
    return this.adminService.getTopProducts(limit);
  }
}
