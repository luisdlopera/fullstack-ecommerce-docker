import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  HomeBannerRepositoryPort,
  HomeBannerRecord,
  CreateHomeBannerInput,
  UpdateHomeBannerInput,
} from '../../domain/ports/home-banner.repository.port';

@Injectable()
export class PrismaHomeBannerRepository implements HomeBannerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<HomeBannerRecord[]> {
    const banners = await this.prisma.homeBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return banners as HomeBannerRecord[];
  }

  async findAll(): Promise<HomeBannerRecord[]> {
    const banners = await this.prisma.homeBanner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return banners as HomeBannerRecord[];
  }

  async findById(id: number): Promise<HomeBannerRecord | null> {
    const banner = await this.prisma.homeBanner.findUnique({
      where: { id },
    });
    return banner as HomeBannerRecord | null;
  }

  async create(input: CreateHomeBannerInput): Promise<HomeBannerRecord> {
    const banner = await this.prisma.homeBanner.create({
      data: {
        title: input.title,
        subtitle: input.subtitle ?? null,
        ctaText: input.ctaText ?? null,
        ctaLink: input.ctaLink ?? null,
        secondaryText: input.secondaryText ?? null,
        secondaryLink: input.secondaryLink ?? null,
        imageUrl: input.imageUrl,
        storageKey: input.storageKey ?? null,
        storageProvider: input.storageProvider ?? null,
        altText: input.altText ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    return banner as HomeBannerRecord;
  }

  async update(id: number, input: UpdateHomeBannerInput): Promise<HomeBannerRecord> {
    const banner = await this.prisma.homeBanner.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
        ...(input.ctaText !== undefined && { ctaText: input.ctaText }),
        ...(input.ctaLink !== undefined && { ctaLink: input.ctaLink }),
        ...(input.secondaryText !== undefined && { secondaryText: input.secondaryText }),
        ...(input.secondaryLink !== undefined && { secondaryLink: input.secondaryLink }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.storageKey !== undefined && { storageKey: input.storageKey }),
        ...(input.storageProvider !== undefined && { storageProvider: input.storageProvider }),
        ...(input.altText !== undefined && { altText: input.altText }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    return banner as HomeBannerRecord;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.homeBanner.delete({
      where: { id },
    });
  }

  async updateSortOrder(ids: number[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.homeBanner.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }
}
