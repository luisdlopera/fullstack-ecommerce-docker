import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AdminController } from './infrastructure/http/admin.controller';
import { AdminService } from './application/admin.service';
import { UploadProductImageUseCase } from './application/use-cases/upload-product-image.use-case';
import { DeleteProductImageUseCase } from './application/use-cases/delete-product-image.use-case';
import { ReorderProductImagesUseCase } from './application/use-cases/reorder-product-images.use-case';
import { SetPrimaryProductImageUseCase } from './application/use-cases/set-primary-product-image.use-case';
import { ADMIN_PRODUCT_IMAGE_REPOSITORY } from './domain/ports/admin-product-image.repository.port';
import { PrismaAdminProductImageRepository } from './infrastructure/persistence/prisma-admin-product-image.repository';

@Module({
  imports: [SharedModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    UploadProductImageUseCase,
    DeleteProductImageUseCase,
    ReorderProductImagesUseCase,
    SetPrimaryProductImageUseCase,
    {
      provide: ADMIN_PRODUCT_IMAGE_REPOSITORY,
      useClass: PrismaAdminProductImageRepository,
    },
  ],
})
export class AdminModule {}
