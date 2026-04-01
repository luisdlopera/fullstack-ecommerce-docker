import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(period?: string) {
    return this.adminService.getDashboardSummary(period);
  }
}
