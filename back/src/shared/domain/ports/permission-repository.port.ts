import { Role } from '@prisma/client';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface PermissionRepositoryPort {
  /**
   * Verifica si un rol tiene un permiso específico
   */
  roleHasPermission(role: Role, permissionId: string): Promise<boolean>;

  /**
   * Obtiene todos los permisos de un rol
   */
  getPermissionsByRole(role: Role): Promise<string[]>;

  /**
   * Obtiene todos los permisos disponibles en el sistema
   */
  getAllPermissions(): Promise<{ id: string; description: string | null }[]>;

  /**
   * Asigna un permiso a un rol (admin only)
   */
  assignPermissionToRole(role: Role, permissionId: string): Promise<void>;

  /**
   * Revoca un permiso de un rol (admin only)
   */
  revokePermissionFromRole(role: Role, permissionId: string): Promise<void>;

  /**
   * Verifica si un usuario tiene un permiso específico
   * Útil para permisos granulares por usuario (override de rol)
   */
  userHasPermission(userId: string, permissionId: string): Promise<boolean>;
}
