import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_PERMISSIONS_KEY } from './auth.decorator';
import type { JwtPayload } from './jwt-payload';
import { isCustomerRole, type PermissionKey } from './permissions';

type RequestWithUser = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  user?: JwtPayload;
};

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(AUTH_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const payload = request.user;

    // Debug logging
    if (process.env.AUTH_DEBUG_LOGS === 'true') {
      console.log('[AUTH DEBUG] AuthorizationGuard check:', {
        url: request.url,
        method: request.method,
        requiredPermissions,
        userPayload: payload,
      });
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      if (process.env.AUTH_DEBUG_LOGS === 'true') {
        console.log('[AUTH DEBUG] User forbidden:', { userId: payload.sub, exists: !!user, isActive: user?.isActive, deletedAt: user?.deletedAt });
      }
      throw new ForbiddenException('Account is not allowed');
    }

    if (isCustomerRole(user.role)) {
      if (process.env.AUTH_DEBUG_LOGS === 'true') {
        console.log('[AUTH DEBUG] Customer role forbidden for admin resource:', { userId: user.id, role: user.role });
      }
      throw new ForbiddenException('CUSTOMER role cannot access admin resources');
    }

    if (user.role === Role.SUPER_ADMIN) {
      if (process.env.AUTH_DEBUG_LOGS === 'true') {
        console.log('[AUTH DEBUG] Super admin allowed:', { userId: user.id });
      }
      return true;
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      select: { permissionId: true },
    });

    const permissionSet = new Set(rolePermissions.map((item) => item.permissionId));
    const hasAllPermissions = requiredPermissions.every((permission) => permissionSet.has(permission));

    if (!hasAllPermissions) {
      if (process.env.AUTH_DEBUG_LOGS === 'true') {
        console.log('[AUTH DEBUG] Insufficient permissions:', {
          userId: user.id,
          role: user.role,
          requiredPermissions,
          userPermissions: rolePermissions.map(p => p.permissionId),
        });
      }
      throw new ForbiddenException('Insufficient permissions');
    }

    if (process.env.AUTH_DEBUG_LOGS === 'true') {
      console.log('[AUTH DEBUG] Access granted:', { userId: user.id, role: user.role });
    }

    return true;
  }
}
