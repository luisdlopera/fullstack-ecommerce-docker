import { Role } from '@prisma/client';

export const ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
  Role.SUPPORT
];

export const MANAGEMENT_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER];

export const FULL_ACCESS_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}
