import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from './shared/shared.module';
import { JwtAuthGuard } from './shared/infrastructure/auth/jwt-auth.guard';
import { RolesGuard } from './shared/infrastructure/auth/roles.guard';
import { RbacGuard } from './shared/infrastructure/auth/rbac.guard';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AuditModule } from './modules/audit/audit.module';
import { ContentModule } from './modules/content/content.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { CorrelationIdMiddleware } from './shared/infrastructure/observability/correlation-id.middleware';
import { RequestLoggingMiddleware } from './shared/infrastructure/observability/request-logging.middleware';
import { LegacyVersionController } from './shared/infrastructure/http/legacy-version.controller';

@Module({
  imports: [
    SharedModule,
    JwtModule.register({}),
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    InventoryModule,
    PaymentsModule,
    ContentModule,
    AdminModule,
    AuditModule,
    RateLimitModule,
  ],
  controllers: [LegacyVersionController],
  providers: [
    // Global JWT Auth Guard - protege todos los endpoints excepto @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global RBAC Guard - verifica roles y permisos granularmente
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    // Legacy Roles Guard - mantenido por compatibilidad
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
