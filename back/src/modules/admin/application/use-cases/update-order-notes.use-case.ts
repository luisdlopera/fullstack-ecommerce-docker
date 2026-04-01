import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class UpdateOrderNotesUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(orderId: string, internalNotes?: string) {
    return this.adminService.updateOrderNotes(orderId, internalNotes);
  }
}
