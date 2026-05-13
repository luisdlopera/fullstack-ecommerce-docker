import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

export type UpdateHomeBannerDto = {
  title?: string;
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
  isActive?: boolean;
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
export class UpdateHomeBannerUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: number, dto: UpdateHomeBannerDto): Promise<HomeBannerRecord> {
    const existing = await this.prisma.homeBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Home banner not found');
    }

    const banner = await this.prisma.homeBanner.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.ctaText !== undefined && { ctaText: dto.ctaText }),
        ...(dto.ctaLink !== undefined && { ctaLink: dto.ctaLink }),
        ...(dto.secondaryText !== undefined && { secondaryText: dto.secondaryText }),
        ...(dto.secondaryLink !== undefined && { secondaryLink: dto.secondaryLink }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.storageKey !== undefined && { storageKey: dto.storageKey }),
        ...(dto.storageProvider !== undefined && { storageProvider: dto.storageProvider }),
        ...(dto.altText !== undefined && { altText: dto.altText }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return banner as HomeBannerRecord;
  }
}
