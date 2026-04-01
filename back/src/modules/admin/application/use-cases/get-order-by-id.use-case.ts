import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(orderId: string) {
    return this.adminService.getOrderById(orderId);
  }
}
