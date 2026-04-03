import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditRecordInput, AuditRepositoryPort } from '../../domain/ports/audit-repository.port';

@Injectable()
export class PrismaAuditRepository implements AuditRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput): Promise<void> {
    const { userId, action, entityType, entityId, metadata, ip, userAgent } = input;

    await this.prisma.auditLog.create({
      data: {
        actorId: userId || 'system',
        action,
        entityType,
        entityId: entityId || 'none',
        metadata: {
          ...metadata,
          _request: {
            ip,
            userAgent,
          },
        },
      },
    });
  }
}
