import type { Role } from './types';
import { ADMIN_ROLES, isAdminRole } from './types';

export const PERMISSIONS = {
	DASHBOARD_READ: 'dashboard.read',
	USERS_READ: 'users.read',
	USERS_MANAGE: 'users.manage',
	ORDERS_READ: 'orders.read',
	ORDERS_UPDATE: 'orders.update',
	ORDERS_CANCEL: 'orders.cancel',
	PRODUCTS_READ: 'products.read',
	PRODUCTS_CREATE: 'products.create',
	PRODUCTS_UPDATE: 'products.update',
	PRODUCTS_DELETE: 'products.delete',
	CATEGORIES_READ: 'categories.read',
	CATEGORIES_CREATE: 'categories.create',
	CATEGORIES_UPDATE: 'categories.update',
	CATEGORIES_DELETE: 'categories.delete',
	INVENTORY_READ: 'inventory.read',
	INVENTORY_ADJUST: 'inventory.adjust',
	PROMOTIONS_MANAGE: 'promotions.manage',
	PAYMENTS_READ: 'payments.read',
	AUDIT_READ: 'audit.read',
	SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
	SUPER_ADMIN: ALL_PERMISSIONS,
	ADMIN: [
		PERMISSIONS.DASHBOARD_READ,
		PERMISSIONS.USERS_READ,
		PERMISSIONS.USERS_MANAGE,
		PERMISSIONS.ORDERS_READ,
		PERMISSIONS.ORDERS_UPDATE,
		PERMISSIONS.ORDERS_CANCEL,
		PERMISSIONS.PRODUCTS_READ,
		PERMISSIONS.PRODUCTS_CREATE,
		PERMISSIONS.PRODUCTS_UPDATE,
		PERMISSIONS.PRODUCTS_DELETE,
		PERMISSIONS.CATEGORIES_READ,
		PERMISSIONS.CATEGORIES_CREATE,
		PERMISSIONS.CATEGORIES_UPDATE,
		PERMISSIONS.CATEGORIES_DELETE,
		PERMISSIONS.INVENTORY_READ,
		PERMISSIONS.INVENTORY_ADJUST,
		PERMISSIONS.PROMOTIONS_MANAGE,
		PERMISSIONS.PAYMENTS_READ,
		PERMISSIONS.AUDIT_READ,
	],
	MANAGER: [
		PERMISSIONS.DASHBOARD_READ,
		PERMISSIONS.ORDERS_READ,
		PERMISSIONS.PRODUCTS_READ,
		PERMISSIONS.CATEGORIES_READ,
		PERMISSIONS.INVENTORY_READ,
		PERMISSIONS.PROMOTIONS_MANAGE,
	],
	SUPPORT: [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_CANCEL, PERMISSIONS.USERS_READ],
	CUSTOMER: [],
};

export { ADMIN_ROLES, isAdminRole };

export function getPermissionsForRole(role: string): PermissionKey[] {
	if (!role) return [];
	const normalized = role.toUpperCase() as Role;
	return ROLE_PERMISSIONS[normalized] ?? [];
}

export function hasPermissionForRole(role: string, permission: PermissionKey): boolean {
	if (!role) return false;
	if (role.toUpperCase() === 'SUPER_ADMIN') return true;
	return getPermissionsForRole(role).includes(permission);
}

export function canAccessCountriesPath(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.SETTINGS_MANAGE);
}

export function canManageUsersWrite(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.USERS_MANAGE);
}

export function canManageProductsWrite(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.PRODUCTS_UPDATE) || hasPermissionForRole(role, PERMISSIONS.PRODUCTS_CREATE);
}

export function canDeleteProduct(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.PRODUCTS_DELETE);
}

export function canManageCategoriesWrite(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.CATEGORIES_CREATE) || hasPermissionForRole(role, PERMISSIONS.CATEGORIES_UPDATE);
}

export function canDeleteCategory(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.CATEGORIES_DELETE);
}

export function canUpdateOrderStatus(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.ORDERS_UPDATE);
}

export function canManageCountriesWrite(role: string): boolean {
	return hasPermissionForRole(role, PERMISSIONS.SETTINGS_MANAGE);
}
