import {
  Controller,
  Get,
  Inject,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { AuditService, AuditQueryFilters, PaginatedAuditResult } from '../../application/audit.service';
import { AuditEntityType } from '../../domain/ports/audit-repository.port';
import { RequirePermissions } from '../auth/rbac.decorator';
import { RequireRoles } from '../auth/rbac.decorator';
import { PERMISSIONS } from '../auth/permissions';

/**
 * Controller para consultar logs de auditoría
 * 
 * Solo accesible por SUPER_ADMIN, ADMIN y MANAGER
 */
@Controller('audit')
@RequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
export class AuditController {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  /**
   * Obtener lista paginada de logs de auditoría
   */
  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('userId') userId?: string,
    @Query('entityType', new ParseEnumPipe(AuditEntityType, { optional: true })) entityType?: AuditEntityType,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaginatedAuditResult> {
    const filters: AuditQueryFilters = {
      userId,
      entityType,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const options = {
      page: page || 1,
      limit: Math.min(limit || 20, 100), // Max 100
    };

    return this.auditService.findAll(filters, options);
  }

  /**
   * Obtener logs de una entidad específica
   */
  @Get('entity/:type/:id')
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async findByEntity(
    @Query('type', new ParseEnumPipe(AuditEntityType)) entityType: AuditEntityType,
    @Query('id') entityId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PaginatedAuditResult> {
    return this.auditService.findByEntity(entityType, entityId, {
      page: page || 1,
      limit: Math.min(limit || 20, 100),
    });
  }

  /**
   * Obtener actividad de un usuario
   */
  @Get('user/:userId')
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async findByUser(
    @Query('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PaginatedAuditResult> {
    return this.auditService.findByUser(userId, {
      page: page || 1,
      limit: Math.min(limit || 20, 100),
    });
  }

  /**
   * Obtener estadísticas de auditoría
   */
  @Get('stats')
  @RequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  async getStats(
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    return this.auditService.getStats(days || 30);
  }
}
