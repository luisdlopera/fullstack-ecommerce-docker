import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { SharedModule } from './shared/shared.module';
import { JwtAuthGuard } from './shared/infrastructure/auth/jwt-auth.guard';
import { AuthorizationGuard } from './shared/infrastructure/auth/authorization.guard';
import { RolesGuard } from './shared/infrastructure/auth/roles.guard';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    SharedModule,
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 400 }] }),
    JwtModule.register({}),
    HealthModule,
    ProductsModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
    InventoryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
