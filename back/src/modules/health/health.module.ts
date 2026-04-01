import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { SharedModule } from '../../shared/shared.module';
import { HealthController } from './infrastructure/http/health.controller';

@Module({
  imports: [SharedModule, TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
