import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetCategoryByIdUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(categoryId: string) {
    return this.adminService.getCategoryById(categoryId);
  }
}
