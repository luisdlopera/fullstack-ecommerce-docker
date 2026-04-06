import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

export type UpdateHomeBannerInput = {
  id: number;
  title?: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  secondaryText?: string | null;
  secondaryLink?: string | null;
  altText?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

@Injectable()
export class UpdateHomeBannerUseCase {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async execute(input: UpdateHomeBannerInput) {
    const existing = await this.prisma.homeBanner.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      throw new NotFoundException('Banner no encontrado');
    }

    return this.prisma.homeBanner.update({
      where: { id: input.id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
        ...(input.ctaText !== undefined && { ctaText: input.ctaText }),
        ...(input.ctaLink !== undefined && { ctaLink: input.ctaLink }),
        ...(input.secondaryText !== undefined && { secondaryText: input.secondaryText }),
        ...(input.secondaryLink !== undefined && { secondaryLink: input.secondaryLink }),
        ...(input.altText !== undefined && { altText: input.altText }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  }
}
