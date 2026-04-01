import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { UpsertCategoryDto } from '../../infrastructure/http/dto/upsert-category.dto';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(categoryId: string, dto: UpsertCategoryDto) {
    return this.adminService.updateCategory(categoryId, dto);
  }
}
