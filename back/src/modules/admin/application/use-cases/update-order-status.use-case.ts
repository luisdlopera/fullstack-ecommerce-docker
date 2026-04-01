import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(orderId: string, status: OrderStatus, actorId: string) {
    return this.adminService.updateOrderStatus(orderId, status, actorId);
  }
}
