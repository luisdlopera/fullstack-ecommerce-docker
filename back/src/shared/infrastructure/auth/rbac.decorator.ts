import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

/**
 * Decorador para requerir permisos específicos (AND lógico - todos deben cumplirse)
 * @example @RequirePermissions(PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE)
 */
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorador para requerir al menos un rol (OR lógico)
 * @example @RequireRoles(Role.ADMIN, Role.MANAGER)
 */
export const RequireRoles = (...roles: Role[]) => 
  SetMetadata(ROLES_KEY, roles);

/**
 * Decorador combinado para requerir permisos Y roles
 * El usuario debe tener TODOS los permisos especificados O uno de los roles especificados
 * @example @Rbac({ permissions: [PERMISSIONS.PRODUCTS_CREATE], roles: [Role.SUPER_ADMIN] })
 */
export interface RbacOptions {
  permissions?: string[];
  roles?: Role[];
  /** Si true, requiere que se cumplan TODAS las condiciones (permisos AND roles). Default: false (permisos OR roles) */
  requireAll?: boolean;
}

export const RBAC_KEY = 'rbac';

export const Rbac = (options: RbacOptions) => {
  return applyDecorators(
    SetMetadata(RBAC_KEY, options),
    // También setear individualmente para compatibilidad con guards legacy
    ...(options.permissions ? [SetMetadata(PERMISSIONS_KEY, options.permissions)] : []),
    ...(options.roles ? [SetMetadata(ROLES_KEY, options.roles)] : []),
  );
};

/**
 * Decorador simplificado: requiere cualquiera de los permisos (OR lógico)
 * @example @AnyPermission(PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE)
 */
export const ANY_PERMISSION_KEY = 'anyPermission';
export const AnyPermission = (...permissions: string[]) => 
  SetMetadata(ANY_PERMISSION_KEY, permissions);
