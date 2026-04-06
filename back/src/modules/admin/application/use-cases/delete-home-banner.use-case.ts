import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { STORAGE_PORT, type StoragePort } from '../../../../shared/domain/ports/storage.port';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Injectable()
export class DeleteHomeBannerUseCase {
  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async execute(id: number): Promise<{ ok: true }> {
    const banner = await this.prisma.homeBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new NotFoundException('Banner no encontrado');
    }

    // Delete from storage if storageKey exists
    if (banner.storageKey) {
      await this.storage.delete(banner.storageKey);
    }

    // Delete from database
    await this.prisma.homeBanner.delete({
      where: { id },
    });

    return { ok: true };
  }
}
