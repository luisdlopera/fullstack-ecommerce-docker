/**
 * Auth Module Exports
 * 
 * Este módulo proporciona guards y decoradores para control de acceso RBAC.
 * 
 * Uso básico:
 * ```typescript
 * import { Auth } from './auth';
 * 
 * @Controller('admin')
 * export class AdminController {
 *   @Auth(PERMISSIONS.DASHBOARD_READ)
 *   @Get('dashboard')
 *   getDashboard() { ... }
 * }
 * ```
 */

// Guards
export { JwtAuthGuard } from './jwt-auth.guard';
export { RolesGuard } from './roles.guard';
export { RbacGuard } from './rbac.guard';
export { AuthorizationGuard } from './authorization.guard';

// Decorators legacy (compatibilidad)
export { Auth } from './auth.decorator';
export { Roles } from './roles.decorator';
export { Public } from './public.decorator';

// Nuevos decoradores RBAC
export { 
  RequirePermissions, 
  RequireRoles, 
  Rbac, 
  AnyPermission,
  type RbacOptions,
  PERMISSIONS_KEY,
  ROLES_KEY,
  RBAC_KEY,
  ANY_PERMISSION_KEY,
} from './rbac.decorator';

// Utilidades
export { CurrentUser } from './current-user.decorator';
export { PERMISSIONS, ROLE_PERMISSIONS, type PermissionKey, isAdminRole, isCustomerRole } from './permissions';
export type { JwtPayload } from './jwt-payload';
