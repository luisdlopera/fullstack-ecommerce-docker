import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AdminController } from './infrastructure/http/admin.controller';
import { AdminService } from './application/admin.service';
import { UploadProductImageUseCase } from './application/use-cases/upload-product-image.use-case';
import { DeleteProductImageUseCase } from './application/use-cases/delete-product-image.use-case';
import { ReorderProductImagesUseCase } from './application/use-cases/reorder-product-images.use-case';
import { SetPrimaryProductImageUseCase } from './application/use-cases/set-primary-product-image.use-case';
import { GetHomeBannersUseCase } from './application/use-cases/get-home-banners.use-case';
import { UploadHomeBannerUseCase } from './application/use-cases/upload-home-banner.use-case';
import { DeleteHomeBannerUseCase } from './application/use-cases/delete-home-banner.use-case';
import { UpdateHomeBannerUseCase } from './application/use-cases/update-home-banner.use-case';
import { ReorderHomeBannersUseCase } from './application/use-cases/reorder-home-banners.use-case';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import {
  GetCollectionsUseCase,
  GetCollectionByIdUseCase,
  CreateCollectionUseCase,
  UpdateCollectionUseCase,
  DeleteCollectionUseCase,
} from './application/use-cases/collection.use-cases';
import { GetSalesChartUseCase } from './application/use-cases/get-sales-chart.use-case';
import { GetRecentOrdersUseCase } from './application/use-cases/get-recent-orders.use-case';
import { GetTopProductsUseCase } from './application/use-cases/get-top-products.use-case';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateUserRoleUseCase } from './application/use-cases/update-user-role.use-case';
import { UpdateUserStatusUseCase } from './application/use-cases/update-user-status.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetOrdersUseCase } from './application/use-cases/get-orders.use-case';
import { GetOrderByIdUseCase } from './application/use-cases/get-order-by-id.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { UpdatePaymentStatusUseCase } from './application/use-cases/update-payment-status.use-case';
import { UpdateOrderNotesUseCase } from './application/use-cases/update-order-notes.use-case';
import { GetProductsUseCase } from './application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { UpdateProductStatusUseCase } from './application/use-cases/update-product-status.use-case';
import { GetCategoriesUseCase } from './application/use-cases/get-categories.use-case';
import { GetCategoryByIdUseCase } from './application/use-cases/get-category-by-id.use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { GetCountriesUseCase } from './application/use-cases/get-countries.use-case';
import { CreateCountryUseCase } from './application/use-cases/create-country.use-case';
import { UpdateCountryUseCase } from './application/use-cases/update-country.use-case';
import { DeleteCountryUseCase } from './application/use-cases/delete-country.use-case';
import { ADMIN_AUDIT_REPOSITORY } from './domain/ports/admin-audit.repository.port';
import { ADMIN_CATEGORY_REPOSITORY } from './domain/ports/admin-category.repository.port';
import { ADMIN_COUNTRY_REPOSITORY } from './domain/ports/admin-country.repository.port';
import { ADMIN_METRICS_REPOSITORY } from './domain/ports/admin-metrics.repository.port';
import { ADMIN_ORDER_REPOSITORY } from './domain/ports/admin-order.repository.port';
import { ADMIN_PRODUCT_IMAGE_REPOSITORY } from './domain/ports/admin-product-image.repository.port';
import { ADMIN_PRODUCT_REPOSITORY } from './domain/ports/admin-product.repository.port';
import { ADMIN_USER_REPOSITORY } from './domain/ports/admin-user.repository.port';
import { PrismaAdminAuditRepository } from './infrastructure/persistence/prisma-admin-audit.repository';
import { PrismaAdminCategoryRepository } from './infrastructure/persistence/prisma-admin-category.repository';
import { PrismaAdminCountryRepository } from './infrastructure/persistence/prisma-admin-country.repository';
import { PrismaAdminMetricsRepository } from './infrastructure/persistence/prisma-admin-metrics.repository';
import { PrismaAdminOrderRepository } from './infrastructure/persistence/prisma-admin-order.repository';
import { PrismaAdminProductImageRepository } from './infrastructure/persistence/prisma-admin-product-image.repository';
import { PrismaAdminProductRepository } from './infrastructure/persistence/prisma-admin-product.repository';
import { PrismaAdminUserRepository } from './infrastructure/persistence/prisma-admin-user.repository';

@Module({
  imports: [SharedModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    GetDashboardSummaryUseCase,
    GetSalesChartUseCase,
    GetRecentOrdersUseCase,
    GetTopProductsUseCase,
    GetUsersUseCase,
    GetUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    UpdateUserRoleUseCase,
    UpdateUserStatusUseCase,
    DeleteUserUseCase,
    GetOrdersUseCase,
    GetOrderByIdUseCase,
    UpdateOrderStatusUseCase,
    UpdatePaymentStatusUseCase,
    UpdateOrderNotesUseCase,
    GetProductsUseCase,
    GetProductByIdUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    UpdateProductStatusUseCase,
    GetCategoriesUseCase,
    GetCategoryByIdUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    GetCountriesUseCase,
    CreateCountryUseCase,
    UpdateCountryUseCase,
    DeleteCountryUseCase,
    UploadProductImageUseCase,
    DeleteProductImageUseCase,
    ReorderProductImagesUseCase,
    SetPrimaryProductImageUseCase,
    GetHomeBannersUseCase,
    UploadHomeBannerUseCase,
    DeleteHomeBannerUseCase,
    UpdateHomeBannerUseCase,
    ReorderHomeBannersUseCase,
    GetCollectionsUseCase,
    GetCollectionByIdUseCase,
    CreateCollectionUseCase,
    UpdateCollectionUseCase,
    DeleteCollectionUseCase,
    {
      provide: ADMIN_METRICS_REPOSITORY,
      useClass: PrismaAdminMetricsRepository,
    },
    {
      provide: ADMIN_USER_REPOSITORY,
      useClass: PrismaAdminUserRepository,
    },
    {
      provide: ADMIN_ORDER_REPOSITORY,
      useClass: PrismaAdminOrderRepository,
    },
    {
      provide: ADMIN_PRODUCT_REPOSITORY,
      useClass: PrismaAdminProductRepository,
    },
    {
      provide: ADMIN_CATEGORY_REPOSITORY,
      useClass: PrismaAdminCategoryRepository,
    },
    {
      provide: ADMIN_COUNTRY_REPOSITORY,
      useClass: PrismaAdminCountryRepository,
    },
    {
      provide: ADMIN_AUDIT_REPOSITORY,
      useClass: PrismaAdminAuditRepository,
    },
    {
      provide: ADMIN_PRODUCT_IMAGE_REPOSITORY,
      useClass: PrismaAdminProductImageRepository,
    },
  ],
})
export class AdminModule {}
