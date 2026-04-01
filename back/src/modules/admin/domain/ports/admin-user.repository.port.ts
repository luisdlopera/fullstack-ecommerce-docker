import type { Role } from '@prisma/client';

export const ADMIN_USER_REPOSITORY = Symbol('ADMIN_USER_REPOSITORY');

export type AdminUserListFilters = {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
  actorRole?: Role;
};

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  phone: string | null;
  emailVerified: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  orderCount: number;
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  phone: string | null;
  image: string | null;
  emailVerified: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  address: unknown | null;
  orderCount: number;
};

export type AdminUserCreateInput = {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role: Role;
};

export type AdminUserUpdateInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  isActive?: boolean;
};

export interface AdminUserRepositoryPort {
  list(filters: AdminUserListFilters): Promise<{ data: AdminUserSummary[]; total: number }>;
  findById(userId: string): Promise<AdminUserDetail | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  findByIdWithRole(userId: string): Promise<{ id: string; role: Role } | null>;
  create(input: AdminUserCreateInput): Promise<AdminUserSummary>;
  update(userId: string, input: AdminUserUpdateInput): Promise<AdminUserSummary>;
  updateRole(userId: string, role: Role): Promise<{ id: string; name: string; email: string; role: Role } | null>;
  updateStatus(userId: string, isActive: boolean): Promise<AdminUserSummary>;
  softDelete(userId: string): Promise<void>;
}
