import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class GetOrdersUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(
    page?: number,
    limit?: number,
    search?: string,
    status?: OrderStatus,
    paymentStatus?: PaymentStatus,
    paid?: boolean,
  ) {
    return this.adminService.getOrders(page, limit, search, status, paymentStatus, paid);
  }
}
