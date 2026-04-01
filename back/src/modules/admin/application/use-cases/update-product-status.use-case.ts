import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class UpdateProductStatusUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(productId: string, isActive: boolean) {
    return this.adminService.updateProductStatus(productId, isActive);
  }
}
