import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_PERMISSIONS_KEY } from './auth.decorator';
import type { JwtPayload } from './jwt-payload';
import { isCustomerRole, type PermissionKey } from './permissions';
import { AuthMessages } from '../../../modules/auth/domain/enums/auth-messages.enum';
import { authDebugEnabled } from '../observability/auth-debug';

type RequestWithUser = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  user?: JwtPayload;
};

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(AuthorizationGuard.name);

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
    if (authDebugEnabled()) {
      this.logger.debug(`AuthorizationGuard check: ${JSON.stringify({
        url: request.url,
        method: request.method,
        requiredPermissions,
        userPayload: payload,
      })}`);
    }

    if (!payload?.sub) {
      throw new UnauthorizedException(AuthMessages.UNAUTHORIZED);
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
      if (authDebugEnabled()) {
        this.logger.debug(`User forbidden: ${JSON.stringify({
          userId: payload.sub,
          exists: !!user,
          isActive: user?.isActive,
          deletedAt: user?.deletedAt,
        })}`);
      }
      throw new ForbiddenException(AuthMessages.ACCOUNT_NOT_ALLOWED);
    }

    if (isCustomerRole(user.role)) {
      if (authDebugEnabled()) {
        this.logger.debug(`Customer role forbidden for admin resource: ${JSON.stringify({ userId: user.id, role: user.role })}`);
      }
      throw new ForbiddenException(AuthMessages.CUSTOMER_ROLE_RESTRICTED);
    }

    if (user.role === Role.SUPER_ADMIN) {
      if (authDebugEnabled()) {
        this.logger.debug(`Super admin allowed: ${JSON.stringify({ userId: user.id })}`);
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
      if (authDebugEnabled()) {
        this.logger.debug(`Insufficient permissions: ${JSON.stringify({
          userId: user.id,
          role: user.role,
          requiredPermissions,
          userPermissions: rolePermissions.map((p) => p.permissionId),
        })}`);
      }
      throw new ForbiddenException(AuthMessages.INSUFFICIENT_PERMISSIONS);
    }

    if (authDebugEnabled()) {
      this.logger.debug(`Access granted: ${JSON.stringify({ userId: user.id, role: user.role })}`);
    }

    return true;
  }
}
