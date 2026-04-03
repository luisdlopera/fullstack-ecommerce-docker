import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
// import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { SharedModule } from './shared/shared.module';
// import { JwtAuthGuard } from './shared/infrastructure/auth/jwt-auth.guard';
// import { AuthorizationGuard } from './shared/infrastructure/auth/authorization.guard';
// import { RolesGuard } from './shared/infrastructure/auth/roles.guard';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
// import { AdminModule } from './modules/admin/admin.module';
// import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CorrelationIdMiddleware } from './shared/infrastructure/observability/correlation-id.middleware';
import { RequestLoggingMiddleware } from './shared/infrastructure/observability/request-logging.middleware';

@Module({
  imports: [
    SharedModule,
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 400 }] }),
    JwtModule.register({}),
    // HealthModule desactivado (TerminusModule bloquea)
    // HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    // Paso 4: OrdersModule + InventoryModule
    OrdersModule,
    InventoryModule,
    // Paso 5: PaymentsModule
    PaymentsModule,
  ],
  // Guards desactivados temporalmente para diagnóstico
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
