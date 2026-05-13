import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class ReorderHomeBannersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(ids: number[]): Promise<{ ok: boolean }> {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.homeBanner.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { ok: true };
  }
}
