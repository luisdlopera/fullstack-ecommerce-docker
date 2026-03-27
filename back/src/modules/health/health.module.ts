import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { HealthController } from './infrastructure/http/health.controller';

@Module({
  imports: [SharedModule],
  controllers: [HealthController],
})
export class HealthModule {}