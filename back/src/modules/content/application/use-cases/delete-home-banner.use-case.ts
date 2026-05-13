import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { NotFoundError } from '../../../../shared/domain/errors/domain-error';

@Injectable()
export class DeleteHomeBannerUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: number): Promise<{ ok: boolean }> {
    const existing = await this.prisma.homeBanner.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Home banner not found');
    }

    await this.prisma.homeBanner.delete({
      where: { id },
    });

    return { ok: true };
  }
}
