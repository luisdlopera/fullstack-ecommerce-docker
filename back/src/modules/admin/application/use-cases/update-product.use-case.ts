import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { UpsertProductDto } from '../../infrastructure/http/dto/upsert-product.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(productId: string, dto: UpsertProductDto) {
    return this.adminService.updateProduct(productId, dto);
  }
}
