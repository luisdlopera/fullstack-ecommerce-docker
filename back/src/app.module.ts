import { Module } from '@nestjs/common';
import { HealthController } from './interfaces/http/health.controller';
import { ProductsModule } from './products.module';

@Module({
  imports: [ProductsModule],
  controllers: [HealthController]
})
export class AppModule {}
