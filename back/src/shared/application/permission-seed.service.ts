import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Role } from '@prisma/client';

import { PermissionRepositoryPort, PERMISSION_REPOSITORY } from '../domain/ports/permission-repository.port';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../infrastructure/auth/permissions';

/**
 * Servicio para inicializar permisos en la base de datos
 * Se ejecuta automáticamente al iniciar la aplicación
 */
@Injectable()
export class PermissionSeedService implements OnModuleInit {
  private readonly logger = new Logger(PermissionSeedService.name);

  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: PermissionRepositoryPort,
  ) {}

  async onModuleInit(): Promise<void> {
    // Solo seedear en desarrollo/test por defecto
    // En producción, usar migraciones manuales
    if (process.env.NODE_ENV === 'production' && process.env.AUTO_SEED_PERMISSIONS !== 'true') {
      this.logger.log('Skipping automatic permission seed in production');
      return;
    }

    try {
      await this.seedPermissions();
      this.logger.log('Permissions seeded successfully');
    } catch (error) {
      this.logger.error('Failed to seed permissions', error);
      // No lanzar error para no bloquear el startup
    }
  }

  /**
   * Crear todos los permisos en la base de datos
   */
  async seedPermissions(): Promise<void> {
    const allPermissions = Object.values(PERMISSIONS);
    
    for (const permissionId of allPermissions) {
      try {
        // El método assignPermissionToRole crea el permiso si no existe
        // Usamos SUPER_ADMIN como rol dummy para crear el permiso
        await this.permissionRepo.assignPermissionToRole(Role.SUPER_ADMIN, permissionId);
      } catch (error) {
        this.logger.warn(`Failed to seed permission ${permissionId}: ${error}`);
      }
    }

    this.logger.log(`Seeded ${allPermissions.length} permissions`);
  }

  /**
   * Asignar permisos a roles según el mapa ROLE_PERMISSIONS
   */
  async seedRolePermissions(): Promise<void> {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      for (const permissionId of permissions) {
        try {
          await this.permissionRepo.assignPermissionToRole(role as Role, permissionId);
        } catch (error) {
          this.logger.warn(`Failed to assign ${permissionId} to ${role}: ${error}`);
        }
      }
      this.logger.log(`Assigned ${permissions.length} permissions to ${role}`);
    }
  }

  /**
   * Verificar que todos los permisos existen en la DB
   */
  async validatePermissions(): Promise<{ valid: boolean; missing: string[] }> {
    const allPermissions = Object.values(PERMISSIONS);
    const dbPermissions = await this.permissionRepo.getAllPermissions();
    const dbPermissionIds = new Set(dbPermissions.map(p => p.id));

    const missing = allPermissions.filter(p => !dbPermissionIds.has(p));

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Resetear todos los permisos y re-crear desde cero
   * ⚠️ Solo usar en desarrollo
   */
  async resetAllPermissions(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset permissions in production');
    }

    // Nota: Esto requeriría eliminar todos los RolePermission primero
    // Implementación depende de tu política de datos
    this.logger.warn('Permission reset requested - implementar según políticas de datos');
  }
}
