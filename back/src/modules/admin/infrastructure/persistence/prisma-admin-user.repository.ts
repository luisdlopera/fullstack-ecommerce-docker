import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  AdminUserCreateInput,
  AdminUserDetail,
  AdminUserListFilters,
  AdminUserRepositoryPort,
  AdminUserSummary,
  AdminUserUpdateInput,
} from '../../domain/ports/admin-user.repository.port';

@Injectable()
export class PrismaAdminUserRepository implements AdminUserRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(filters: AdminUserListFilters): Promise<{ data: AdminUserSummary[]; total: number }> {
    const { page, limit, search, role, isActive, actorRole } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: search },
      ];
    }
    if (actorRole === Role.SUPPORT) {
      where.role = 'CUSTOMER' as Role;
    } else if (role) {
      where.role = role;
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          phone: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { Order: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = rows.map((row) => ({
      ...row,
      orderCount: row._count.Order,
      _count: undefined,
    }));

    return { data, total };
  }

  async findById(userId: string): Promise<AdminUserDetail | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        image: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          include: { country: true },
          orderBy: { id: 'desc' },
          take: 1,
        },
        _count: { select: { Order: true } },
      },
    });

    if (!user) return null;

    const address = user.addresses[0] ?? null;

    return {
      ...user,
      address,
      addresses: undefined,
      orderCount: user._count.Order,
      _count: undefined,
    } as AdminUserDetail;
  }

  findByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  findByIdWithRole(userId: string): Promise<{ id: string; role: Role } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
  }

  create(input: AdminUserCreateInput): Promise<AdminUserSummary> {
    return this.prisma.user
      .create({
        data: {
          name: input.name,
          email: input.email,
          password: input.passwordHash,
          phone: input.phone,
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          phone: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { Order: true } },
        },
      })
      .then((user) => ({
        ...user,
        orderCount: user._count.Order,
        _count: undefined,
      })) as Promise<AdminUserSummary>;
  }

  update(userId: string, input: AdminUserUpdateInput): Promise<AdminUserSummary> {
    return this.prisma.user
      .update({
        where: { id: userId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          isActive: input.isActive,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          phone: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { Order: true } },
        },
      })
      .then((user) => ({
        ...user,
        orderCount: user._count.Order,
        _count: undefined,
      })) as Promise<AdminUserSummary>;
  }

  updateRole(userId: string, role: Role): Promise<{ id: string; name: string; email: string; role: Role } | null> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  updateStatus(userId: string, isActive: boolean): Promise<AdminUserSummary> {
    return this.prisma.user
      .update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          phone: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { Order: true } },
        },
      })
      .then((user) => ({
        ...user,
        orderCount: user._count.Order,
        _count: undefined,
      })) as Promise<AdminUserSummary>;
  }

  async softDelete(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
