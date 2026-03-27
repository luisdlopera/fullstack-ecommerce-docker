import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AdminController } from './infrastructure/http/admin.controller';
import { AdminService } from './application/admin.service';

@Module({
  imports: [SharedModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
