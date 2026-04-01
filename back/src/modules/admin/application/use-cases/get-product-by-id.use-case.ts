import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetProductByIdUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(productId: string) {
    return this.adminService.getProductById(productId);
  }
}
