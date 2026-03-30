import { Role } from '@prisma/client';

export const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.SUPPORT];

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

const ALL_PERMISSION_VALUES: PermissionKey[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  [Role.SUPER_ADMIN]: ALL_PERMISSION_VALUES,
  [Role.ADMIN]: [
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
  [Role.MANAGER]: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.CATEGORIES_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.PROMOTIONS_MANAGE,
  ],
  [Role.SUPPORT]: [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_CANCEL, PERMISSIONS.USERS_READ],
  [Role.CUSTOMER]: [],
};

export const MANAGEMENT_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER];

export const FULL_ACCESS_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isCustomerRole(role: Role): boolean {
  return role === Role.CUSTOMER;
}
