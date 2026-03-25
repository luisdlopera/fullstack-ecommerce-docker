import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './interfaces/http/health.controller';
import { ProductsModule } from './products.module';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({}),
    ProductsModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    PaymentsModule,
    AdminModule
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
