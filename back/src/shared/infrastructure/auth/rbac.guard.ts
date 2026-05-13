import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { JwtPayload } from './jwt-payload';
import { PERMISSIONS_KEY, ROLES_KEY, RBAC_KEY, ANY_PERMISSION_KEY, RbacOptions } from './rbac.decorator';
import { PermissionRepositoryPort, PERMISSION_REPOSITORY } from '../../domain/ports/permission-repository.port';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLE_PERMISSIONS, PermissionKey } from './permissions';
import { AUTH_PERMISSIONS_KEY } from './auth.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip si es público
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Obtener metadatos
    const rbacOptions = this.reflector.getAllAndOverride<RbacOptions>(RBAC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Soportar @Auth() decorador existente
    const authPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(AUTH_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = rbacOptions?.permissions ?? 
      authPermissions ??
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    const requiredRoles = rbacOptions?.roles ??
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    const anyPermissions = this.reflector.getAllAndOverride<string[]>(ANY_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay restricciones, permitir
    const hasNoRestrictions = !requiredPermissions?.length && !requiredRoles?.length && !anyPermissions?.length;
    if (hasNoRestrictions) {
      return true;
    }

    // Obtener usuario del request
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload; requestId?: string }>();
    const user = request.user;

    if (!user) {
      this.logger.warn(`[${request.requestId}] Access denied: No user in request`);
      throw new ForbiddenException('Authentication required');
    }

    // Caso SUPER_ADMIN: bypass completo
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    const requireAll = rbacOptions?.requireAll ?? false;

    // Verificar roles
    const roleCheck = this.checkRoles(user.role, requiredRoles);

    // Verificar permisos (todos deben cumplirse - AND)
    const permissionsCheck = await this.checkAllPermissions(user.role, requiredPermissions);

    // Verificar any permissions (al menos uno - OR)
    const anyPermissionCheck = anyPermissions?.length 
      ? await this.checkAnyPermission(user.role, anyPermissions)
      : true;

    if (requireAll) {
      // Modo estricto: debe cumplir TODAS las condiciones
      if (!roleCheck.ok) {
        throw new ForbiddenException(`Missing required role. Required: ${requiredRoles?.join(', ')}`);
      }
      if (!permissionsCheck.ok) {
        throw new ForbiddenException(`Missing permissions: ${permissionsCheck.missing?.join(', ')}`);
      }
      if (!anyPermissionCheck) {
        throw new ForbiddenException(`Missing any of the required permissions`);
      }
      return true;
    } else {
      // Modo flexible: permisos OR roles OR anyPermission
      const hasAccess = roleCheck.ok || permissionsCheck.ok || anyPermissionCheck;

      if (!hasAccess) {
        const contextName = `${context.getClass().name}.${context.getHandler().name}`;
        this.logger.warn(
          `[${request.requestId}] Access denied for ${user.sub} (${user.role}) to ${contextName}. ` +
          `Roles: ${requiredRoles?.join(', ') || 'none'}, ` +
          `Permissions: ${requiredPermissions?.join(', ') || 'none'}`
        );
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    }
  }

  private checkRoles(userRole: Role, requiredRoles?: Role[]): { ok: boolean } {
    if (!requiredRoles?.length) return { ok: false }; // No roles required, no match
    const ok = requiredRoles.includes(userRole);
    return { ok };
  }

  private async checkAllPermissions(
    userRole: Role, 
    requiredPermissions?: string[]
  ): Promise<{ ok: boolean; missing?: string[] }> {
    if (!requiredPermissions?.length) return { ok: false }; // No permissions required, no match

    // Obtener permisos del rol desde DB o caché en memoria
    const rolePermissions = await this.getRolePermissions(userRole);

    const missing: string[] = [];
    for (const permission of requiredPermissions) {
      if (!rolePermissions.includes(permission)) {
        missing.push(permission);
      }
    }

    return { ok: missing.length === 0, missing: missing.length > 0 ? missing : undefined };
  }

  private async checkAnyPermission(userRole: Role, anyPermissions: string[]): Promise<boolean> {
    const rolePermissions = await this.getRolePermissions(userRole);
    return anyPermissions.some(p => rolePermissions.includes(p));
  }

  /**
   * Cache simple en memoria para permisos de roles
   * En producción, usar Redis
   */
  private rolePermissionsCache = new Map<Role, string[]>();

  private async getRolePermissions(role: Role): Promise<string[]> {
    // Usar cache local
    if (this.rolePermissionsCache.has(role)) {
      return this.rolePermissionsCache.get(role)!;
    }

    // Intentar obtener de DB
    try {
      const dbPermissions = await this.permissionRepo.getPermissionsByRole(role);
      
      // Si no hay permisos en DB, usar los hardcodeados como fallback
      if (dbPermissions.length === 0) {
        const hardcoded = ROLE_PERMISSIONS[role] || [];
        this.rolePermissionsCache.set(role, hardcoded);
        return hardcoded;
      }

      this.rolePermissionsCache.set(role, dbPermissions);
      return dbPermissions;
    } catch {
      // Fallback a permisos hardcodeados si hay error de DB
      this.logger.warn(`Failed to load permissions from DB, using hardcoded fallback for ${role}`);
      const hardcoded = ROLE_PERMISSIONS[role] || [];
      return hardcoded;
    }
  }

  /**
   * Invalidar cache para un rol (útil cuando se modifican permisos)
   */
  invalidateRoleCache(role: Role): void {
    this.rolePermissionsCache.delete(role);
    this.logger.log(`Cache invalidated for role ${role}`);
  }
}
