import { Inject, Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class UpdatePaymentStatusUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(orderId: string, paymentStatus: PaymentStatus) {
    return this.adminService.updatePaymentStatus(orderId, paymentStatus);
  }
}
