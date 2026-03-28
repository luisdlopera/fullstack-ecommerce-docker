import type { Role } from './types';
import { ADMIN_ROLES, isAdminRole } from './types';

/** Aligned with back/src/shared/infrastructure/auth/permissions.ts */
export const FULL_ACCESS_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN'];

export const MANAGEMENT_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export { ADMIN_ROLES, isAdminRole };

export function hasFullAccess(role: string): boolean {
	return FULL_ACCESS_ROLES.includes(role as Role);
}

export function hasManagementAccess(role: string): boolean {
	return MANAGEMENT_ROLES.includes(role as Role);
}

/** GET /admin/countries is allowed for all ADMIN_ROLES; nav + write restricted to full access per product rules. */
export function canAccessCountriesPath(role: string): boolean {
	return hasFullAccess(role);
}

export function canManageUsersWrite(role: string): boolean {
	return hasFullAccess(role);
}

export function canManageProductsWrite(role: string): boolean {
	return hasManagementAccess(role);
}

export function canDeleteProduct(role: string): boolean {
	return hasFullAccess(role);
}

export function canManageCategoriesWrite(role: string): boolean {
	return hasManagementAccess(role);
}

export function canDeleteCategory(role: string): boolean {
	return hasFullAccess(role);
}

export function canUpdateOrderStatus(role: string): boolean {
	return hasManagementAccess(role);
}

export function canManageCountriesWrite(role: string): boolean {
	return hasFullAccess(role);
}
