import { Inject, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

import {
  AUDIT_REPOSITORY,
  AuditEntityType,
  AuditRecordInput,
  AuditRepositoryPort,
} from '../domain/ports/audit-repository.port';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

export interface AuditQueryFilters {
  userId?: string;
  entityType?: AuditEntityType | string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  ip?: string;
}

export interface AuditQueryOptions {
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'action' | 'entityType';
  order?: 'asc' | 'desc';
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export interface PaginatedAuditResult {
  data: AuditLogEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Servicio de Auditoría para registrar y consultar logs de actividad
 * 
 * Uso:
 * ```typescript
 * // Registrar una acción
 * await this.auditService.record({
 *   userId: 'user-123',
 *   action: 'PRODUCT_CREATED',
 *   entityType: AuditEntityType.PRODUCT,
 *   entityId: 'prod-456',
 *   metadata: { name: 'Product Name', price: 100 },
 *   request, // opcional: extrae ip y userAgent
 * });
 * 
 * // Consultar logs
 * const logs = await this.auditService.findAll({
 *   filters: { entityType: AuditEntityType.PRODUCT },
 *   options: { page: 1, limit: 20 }
 * });
 * ```
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  /**
   * Registrar una acción en el log de auditoría
   */
  async record(input: AuditRecordInput & { request?: Request }): Promise<void> {
    const { request, ...recordInput } = input;

    // Extraer IP y UserAgent del request si se proporciona
    const ip = request?.ip || request?.headers['x-forwarded-for']?.toString() || recordInput.ip;
    const userAgent = request?.headers['user-agent'] || recordInput.userAgent;

    await this.auditRepository.record({
      ...recordInput,
      ip: ip?.toString(),
      userAgent: userAgent?.toString(),
    });

    this.logger.debug(`Audit recorded: ${recordInput.action} on ${recordInput.entityType}:${recordInput.entityId}`);
  }

  /**
   * Registrar login exitoso
   */
  async recordLogin(
    userId: string,
    request?: Request,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.record({
      userId,
      action: 'USER_LOGIN',
      entityType: AuditEntityType.AUTH,
      entityId: userId,
      metadata: { ...metadata, success: true },
      request,
    });
  }

  /**
   * Registrar login fallido
   */
  async recordFailedLogin(
    email: string,
    request?: Request,
    reason?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.record({
      action: 'USER_LOGIN_FAILED',
      entityType: AuditEntityType.AUTH,
      entityId: email,
      metadata: { email, reason, success: false, ...metadata },
      request,
    });
  }

  /**
   * Registrar logout
   */
  async recordLogout(userId: string, request?: Request): Promise<void> {
    await this.record({
      userId,
      action: 'USER_LOGOUT',
      entityType: AuditEntityType.AUTH,
      entityId: userId,
      request,
    });
  }

  /**
   * Registrar creación de entidad
   */
  async recordCreate(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    data: Record<string, unknown>,
    request?: Request,
  ): Promise<void> {
    await this.record({
      userId,
      action: `${entityType.toUpperCase()}_CREATED`,
      entityType,
      entityId,
      metadata: { newData: data },
      request,
    });
  }

  /**
   * Registrar actualización de entidad (con cambios)
   */
  async recordUpdate(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    request?: Request,
  ): Promise<void> {
    const changes = this.computeChanges(oldData, newData);

    await this.record({
      userId,
      action: `${entityType.toUpperCase()}_UPDATED`,
      entityType,
      entityId,
      metadata: {
        changes,
        oldData,
        newData,
      },
      request,
    });
  }

  /**
   * Registrar eliminación de entidad
   */
  async recordDelete(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    data: Record<string, unknown>,
    request?: Request,
  ): Promise<void> {
    await this.record({
      userId,
      action: `${entityType.toUpperCase()}_DELETED`,
      entityType,
      entityId,
      metadata: { deletedData: data },
      request,
    });
  }

  /**
   * Registrar acción de administrador (cambio de estado, permisos, etc)
   */
  async recordAdminAction(
    adminId: string,
    action: string,
    targetUserId: string,
    details: Record<string, unknown>,
    request?: Request,
  ): Promise<void> {
    await this.record({
      userId: adminId,
      action: `ADMIN_${action}`,
      entityType: AuditEntityType.USER,
      entityId: targetUserId,
      metadata: { adminId, targetUserId, ...details },
      request,
    });
  }

  /**
   * Consultar logs de auditoría con filtros y paginación
   */
  async findAll(
    filters: AuditQueryFilters = {},
    options: AuditQueryOptions = {},
  ): Promise<PaginatedAuditResult> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'createdAt',
      order = 'desc',
    } = options;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (filters.userId) {
      where.actorId = filters.userId;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Obtener información de usuarios relacionados
    const userIds = [...new Set(logs.map(log => log.actorId).filter(id => id !== 'system'))];
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const logsWithUser = logs.map(log => ({
      ...log,
      user: userMap.get(log.actorId) || null,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: logsWithUser as AuditLogEntry[],
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Obtener logs de una entidad específica
   */
  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    options: AuditQueryOptions = {},
  ): Promise<PaginatedAuditResult> {
    return this.findAll({ entityType, entityId }, options);
  }

  /**
   * Obtener actividad reciente de un usuario
   */
  async findByUser(
    userId: string,
    options: AuditQueryOptions = {},
  ): Promise<PaginatedAuditResult> {
    return this.findAll({ userId }, options);
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getStats(days: number = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalActions, actionsByType, topUsers] = await Promise.all([
      this.prisma.auditLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: { action: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['actorId'],
        where: { createdAt: { gte: startDate } },
        _count: { actorId: true },
        orderBy: { _count: { actorId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalActions,
      actionsByType: actionsByType.reduce((acc, curr) => {
        acc[curr.action] = curr._count.action;
        return acc;
      }, {} as Record<string, number>),
      topUsers: topUsers.map(u => ({ userId: u.actorId, count: u._count.actorId })),
    };
  }

  /**
   * Calcular diferencias entre dos objetos
   */
  private computeChanges(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
  ): Array<{ field: string; old: unknown; new: unknown }> {
    const changes: Array<{ field: string; old: unknown; new: unknown }> = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      // Ignorar campos de metadata
      if (key.startsWith('_') || key === 'createdAt' || key === 'updatedAt') {
        continue;
      }

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          old: oldVal,
          new: newVal,
        });
      }
    }

    return changes;
  }
}
