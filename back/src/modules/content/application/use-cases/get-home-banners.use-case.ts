import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  HOME_BANNER_REPOSITORY,
  type HomeBannerRepositoryPort,
  type HomeBannerRecord,
} from '../../domain/ports/home-banner.repository.port';
import { StorageConfig } from '../../../../shared/infrastructure/storage/storage.config';

@Injectable()
export class GetHomeBannersUseCase {
  private readonly logger = new Logger(GetHomeBannersUseCase.name);

  constructor(
    @Inject(HOME_BANNER_REPOSITORY) private readonly homeBannerRepository: HomeBannerRepositoryPort,
    @Inject(StorageConfig) private readonly storageConfig: StorageConfig,
  ) {}

  async execute(): Promise<HomeBannerRecord[]> {
    const banners = await this.homeBannerRepository.findAllActive();

    return banners.map((banner) => ({
      ...banner,
      imageUrl: this.buildImageUrl(banner.storageKey, banner.imageUrl),
    }));
  }

  private buildImageUrl(storageKey: string | null, storedUrl: string): string {
    if (storageKey) {
      return `${this.storageConfig.publicUrl}/${storageKey}`;
    }
    if (storedUrl?.startsWith('http')) {
      return storedUrl;
    }
    return `${this.storageConfig.publicUrl}/${storedUrl.replace(/^\//, '')}`;
  }
}
