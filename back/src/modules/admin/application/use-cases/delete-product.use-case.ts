import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class DeleteProductUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(productId: string, actorId: string) {
    return this.adminService.deleteProduct(productId, actorId);
  }
}
