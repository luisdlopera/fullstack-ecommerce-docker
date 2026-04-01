import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { UpsertCategoryDto } from '../../infrastructure/http/dto/upsert-category.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(dto: UpsertCategoryDto) {
    return this.adminService.createCategory(dto);
  }
}
