import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

import { PermissionRepositoryPort } from '../../domain/ports/permission-repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepositoryPort {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async roleHasPermission(role: Role, permissionId: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({
      where: {
        role,
        permissionId,
      },
    });
    return count > 0;
  }

  async getPermissionsByRole(role: Role): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      select: { permissionId: true },
    });
    return rolePermissions.map(rp => rp.permissionId);
  }

  async getAllPermissions(): Promise<{ id: string; description: string | null }[]> {
    return this.prisma.permission.findMany({
      select: { id: true, description: true },
      orderBy: { id: 'asc' },
    });
  }

  async assignPermissionToRole(role: Role, permissionId: string): Promise<void> {
    // Verificar que el permiso existe
    const permissionExists = await this.prisma.permission.count({
      where: { id: permissionId },
    });

    if (permissionExists === 0) {
      // Crear el permiso si no existe (seed dinámico)
      await this.prisma.permission.create({
        data: { id: permissionId },
      });
    }

    // Crear la relación (upsert para evitar duplicados)
    await this.prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
      update: {}, // No hay campos adicionales que actualizar
      create: {
        role,
        permissionId,
      },
    });
  }

  async revokePermissionFromRole(role: Role, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        role,
        permissionId,
      },
    });
  }

  async userHasPermission(userId: string, permissionId: string): Promise<boolean> {
    // Obtener el usuario con su rol
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // Verificar si el rol tiene el permiso
    return this.roleHasPermission(user.role, permissionId);
  }
}
