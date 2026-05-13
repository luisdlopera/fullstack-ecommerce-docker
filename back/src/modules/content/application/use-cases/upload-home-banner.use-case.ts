import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { StorageConfig } from '../../../../shared/infrastructure/storage/storage.config';

export type UploadHomeBannerDto = {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
  imageUrl?: string;
  storageKey?: string;
  storageProvider?: string;
  altText?: string;
  sortOrder?: number;
  file?: { buffer: Buffer; originalname: string; mimetype: string };
};

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
export class UploadHomeBannerUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageConfig: StorageConfig,
  ) {}

  async execute(dto: UploadHomeBannerDto): Promise<HomeBannerRecord> {
    const maxOrder = await this.prisma.homeBanner.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const banner = await this.prisma.homeBanner.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        ctaText: dto.ctaText ?? null,
        ctaLink: dto.ctaLink ?? null,
        secondaryText: dto.secondaryText ?? null,
        secondaryLink: dto.secondaryLink ?? null,
        imageUrl: dto.imageUrl ?? '',
        storageKey: dto.storageKey ?? null,
        storageProvider: dto.storageProvider ?? null,
        altText: dto.altText ?? null,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
        isActive: true,
      },
    });

    return banner as HomeBannerRecord;
  }
}
