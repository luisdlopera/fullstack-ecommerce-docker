import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { HOME_BANNER_REPOSITORY } from './domain/ports/home-banner.repository.port';
import { PrismaHomeBannerRepository } from './infrastructure/persistence/prisma-home-banner.repository';
import { GetHomeBannersUseCase } from './application/use-cases/get-home-banners.use-case';
import { UploadHomeBannerUseCase } from './application/use-cases/upload-home-banner.use-case';
import { UpdateHomeBannerUseCase } from './application/use-cases/update-home-banner.use-case';
import { DeleteHomeBannerUseCase } from './application/use-cases/delete-home-banner.use-case';
import { ReorderHomeBannersUseCase } from './application/use-cases/reorder-home-banners.use-case';

@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: HOME_BANNER_REPOSITORY,
      useClass: PrismaHomeBannerRepository,
    },
    GetHomeBannersUseCase,
    UploadHomeBannerUseCase,
    UpdateHomeBannerUseCase,
    DeleteHomeBannerUseCase,
    ReorderHomeBannersUseCase,
  ],
  exports: [
    GetHomeBannersUseCase,
    UploadHomeBannerUseCase,
    UpdateHomeBannerUseCase,
    DeleteHomeBannerUseCase,
    ReorderHomeBannersUseCase,
    HOME_BANNER_REPOSITORY,
  ],
})
export class ContentModule {}
