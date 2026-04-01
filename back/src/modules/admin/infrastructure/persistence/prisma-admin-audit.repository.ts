import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { AdminAuditRepositoryPort } from '../../domain/ports/admin-audit.repository.port';

@Injectable()
export class PrismaAdminAuditRepository implements AdminAuditRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: { actorId: string; action: string; entityType: string; entityId: string; metadata?: Record<string, unknown> }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata ?? {}) as never,
      },
    });
  }
}
