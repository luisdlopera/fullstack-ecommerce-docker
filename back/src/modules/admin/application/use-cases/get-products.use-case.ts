import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetProductsUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(page?: number, limit?: number, search?: string, categoryId?: string, isActive?: boolean, inStock?: boolean) {
    return this.adminService.getProducts(page, limit, search, categoryId, isActive, inStock);
  }
}
