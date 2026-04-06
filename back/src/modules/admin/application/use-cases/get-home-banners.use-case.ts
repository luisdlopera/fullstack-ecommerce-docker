import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { StorageConfig } from '../../../../shared/infrastructure/storage/storage.config';

export type HomeBannerRecord = {
  id: number;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  secondaryText: string | null;
  secondaryLink: string | null;
  imageUrl: string;
  storageKey: string | null;
  storageProvider: string | null;
  altText: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GetHomeBannersUseCase {
  private readonly logger = new Logger(GetHomeBannersUseCase.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageConfig) private readonly storageConfig: StorageConfig,
  ) {}

  async execute(): Promise<HomeBannerRecord[]> {
    const banners = await this.prisma.homeBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Construct public URLs dynamically using storageConfig.publicUrl
    return banners.map((banner) => ({
      ...banner,
      imageUrl: this.buildImageUrl(banner.storageKey, banner.imageUrl),
    }));
  }

  private buildImageUrl(storageKey: string | null, storedUrl: string): string {
    // Priority 1: If we have storageKey, construct URL dynamically
    if (storageKey) {
      return `${this.storageConfig.publicUrl}/${storageKey}`;
    }
    // Priority 2: If stored URL starts with http, use it (for backwards compatibility)
    if (storedUrl?.startsWith('http')) {
      return storedUrl;
    }
    // Priority 3: Treat storedUrl as a path and construct full URL
    return `${this.storageConfig.publicUrl}/${storedUrl.replace(/^\//, '')}`;
  }
}
