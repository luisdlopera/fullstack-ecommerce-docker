import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { UpsertProductDto } from '../../infrastructure/http/dto/upsert-product.dto';

@Injectable()
export class CreateProductUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(dto: UpsertProductDto) {
    return this.adminService.createProduct(dto);
  }
}
