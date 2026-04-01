import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Injectable()
export class GetSalesChartUseCase {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  execute(period?: string) {
    return this.adminService.getSalesChart(period);
  }
}
