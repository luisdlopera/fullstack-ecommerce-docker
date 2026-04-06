import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

export type ReorderHomeBannersInput = {
  bannerIds: number[];
};

@Injectable()
export class ReorderHomeBannersUseCase {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async execute(input: ReorderHomeBannersInput): Promise<{ ok: true }> {
    if (!input.bannerIds || input.bannerIds.length === 0) {
      throw new BadRequestException('Se requiere un array de IDs de banners');
    }

    // Verify all banners exist
    const existingBanners = await this.prisma.homeBanner.findMany({
      where: { id: { in: input.bannerIds } },
      select: { id: true },
    });

    if (existingBanners.length !== input.bannerIds.length) {
      throw new NotFoundException('Algunos banners no fueron encontrados');
    }

    // Update sort orders in transaction
    await this.prisma.$transaction(
      input.bannerIds.map((id, index) =>
        this.prisma.homeBanner.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { ok: true };
  }
}
