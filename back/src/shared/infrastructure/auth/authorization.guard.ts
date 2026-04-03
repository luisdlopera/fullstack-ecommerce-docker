import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_PERMISSIONS_KEY } from './auth.decorator';
import type { JwtPayload } from './jwt-payload';
import { isCustomerRole, type PermissionKey } from './permissions';

type RequestWithUser = {
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
      throw new ForbiddenException('Account is not allowed');
    }

    if (isCustomerRole(user.role)) {
      throw new ForbiddenException('CUSTOMER role cannot access admin resources');
    }

    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      select: { permissionId: true },
    });

    const permissionSet = new Set(rolePermissions.map((item) => item.permissionId));
    const hasAllPermissions = requiredPermissions.every((permission) => permissionSet.has(permission));

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
