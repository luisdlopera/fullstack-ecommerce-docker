import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InventoryMovementType, Prisma, type InventoryItem, type Size } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  InventoryItemWithProduct,
  InventoryMovementWithItem,
  InventoryRepositoryPort,
  ReserveLineItem,
} from '../../domain/ports/inventory-repository.port';

const PRODUCT_INCLUDE = {
  id: true,
  title: true,
  slug: true,
  sku: true,
  isActive: true,
  ProductImage: {
    select: { id: true, url: true, isPrimary: true },
    orderBy: { sortOrder: 'asc' as const },
    take: 1,
  },
};

const MOVEMENT_INCLUDE = {
  inventoryItem: {
    select: {
      id: true,
      productId: true,
      size: true,
      location: true,
      product: { select: { id: true, title: true, sku: true } },
    },
  },
};

@Injectable()
export class PrismaInventoryRepository implements InventoryRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listItems(params: {
    skip: number;
    take: number;
    search?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    productId?: string;
    location?: string;
  }): Promise<{ data: InventoryItemWithProduct[]; total: number }> {
    const where: Prisma.InventoryItemWhereInput = {};

    if (params.productId) {
      where.productId = params.productId;
    }

    if (params.location) {
      where.location = params.location;
    }

    if (params.search) {
      where.product = {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    if (params.outOfStock) {
      where.available = 0;
    } else if (params.lowStock) {
      where.AND = [
        { available: { gt: 0 } },
        {
          available: {
            lte: this.prisma.inventoryItem.fields?.minStock
              ? undefined
              : 0, // fallback handled via raw
          },
        },
      ];
      // Use raw filter for "available <= minStock"
      where.AND = [
        { available: { gt: 0 } },
      ];
      // We'll filter at the query level with a raw approach via Prisma
      // Actually we can use Prisma's feature:
      delete where.AND;
      where.available = { gt: 0 };
      // We need a workaround since Prisma doesn't support field-to-field comparison directly.
      // We'll fetch more and filter, or use $queryRaw. For simplicity, filter in code.
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ available: 'asc' }, { createdAt: 'desc' }],
        include: { product: { select: PRODUCT_INCLUDE } },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    let filtered = data;
    if (params.lowStock && !params.outOfStock) {
      filtered = data.filter((item) => item.available > 0 && item.available <= item.minStock);
    }

    return { data: filtered, total: params.lowStock ? filtered.length : total };
  }

  async getItemById(itemId: string): Promise<InventoryItemWithProduct | null> {
    return this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { product: { select: PRODUCT_INCLUDE } },
    });
  }

  async getItemsByProductId(productId: string): Promise<InventoryItemWithProduct[]> {
    return this.prisma.inventoryItem.findMany({
      where: { productId },
      orderBy: { size: 'asc' },
      include: { product: { select: PRODUCT_INCLUDE } },
    });
  }

  async adjustInventory(
    itemId: string,
    quantity: number,
    reason: string,
    userId: string,
  ): Promise<InventoryItem> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) throw new BadRequestException('Inventory item not found');

      const newAvailable = item.available + quantity;
      if (newAvailable < 0) {
        throw new BadRequestException(
          `Cannot adjust: would result in negative stock (current: ${item.available}, adjustment: ${quantity})`,
        );
      }

      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { available: newAvailable },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: itemId,
          type: InventoryMovementType.ADJUSTMENT,
          quantity,
          reason,
          userId,
        },
      });

      return updated;
    });
  }

  async reserveStock(
    items: ReserveLineItem[],
    orderId: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const line of items) {
        // Find the inventory item for this product+size
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            productId: line.productId,
            size: line.size,
            location: 'MAIN',
          },
        });

        if (!inventoryItem) {
          throw new BadRequestException(
            `No inventory record for product ${line.productId} size ${line.size}`,
          );
        }

        // Atomic update with guard: only update if available >= quantity
        const updated = await tx.inventoryItem.updateMany({
          where: {
            id: inventoryItem.id,
            available: { gte: line.quantity },
          },
          data: {
            available: { decrement: line.quantity },
            reserved: { increment: line.quantity },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for product ${line.productId} size ${line.size} (available: ${inventoryItem.available}, requested: ${line.quantity})`,
          );
        }

        // Log movement
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            type: InventoryMovementType.RESERVATION,
            quantity: -line.quantity,
            reason: `Stock reserved for order ${orderId}`,
            referenceType: 'order',
            referenceId: orderId,
            userId,
          },
        });
      }
    });
  }

  async releaseStock(orderId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Find all reservation movements for this order
      const reservations = await tx.inventoryMovement.findMany({
        where: {
          referenceType: 'order',
          referenceId: orderId,
          type: InventoryMovementType.RESERVATION,
        },
        include: { inventoryItem: true },
      });

      if (reservations.length === 0) return;

      // Check if stock was already committed
      const commitCount = await tx.inventoryMovement.count({
        where: {
          referenceType: 'order',
          referenceId: orderId,
          type: InventoryMovementType.COMMIT,
        },
      });

      if (commitCount > 0) return; // Already committed, nothing to release

      // Check if already released
      const releaseCount = await tx.inventoryMovement.count({
        where: {
          referenceType: 'order',
          referenceId: orderId,
          type: InventoryMovementType.RELEASE,
        },
      });

      if (releaseCount > 0) return; // Already released (idempotent)

      for (const reservation of reservations) {
        const releaseQty = Math.abs(reservation.quantity);

        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: {
            available: { increment: releaseQty },
            reserved: { decrement: releaseQty },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: reservation.inventoryItemId,
            type: InventoryMovementType.RELEASE,
            quantity: releaseQty,
            reason: `Stock released for cancelled/failed order ${orderId}`,
            referenceType: 'order',
            referenceId: orderId,
            userId,
          },
        });
      }
    });
  }

  async commitStock(orderId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Find all reservation movements for this order
      const reservations = await tx.inventoryMovement.findMany({
        where: {
          referenceType: 'order',
          referenceId: orderId,
          type: InventoryMovementType.RESERVATION,
        },
      });

      if (reservations.length === 0) return;

      // Check idempotency
      const commitCount = await tx.inventoryMovement.count({
        where: {
          referenceType: 'order',
          referenceId: orderId,
          type: InventoryMovementType.COMMIT,
        },
      });

      if (commitCount > 0) return;

      for (const reservation of reservations) {
        const commitQty = Math.abs(reservation.quantity);

        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: {
            reserved: { decrement: commitQty },
            committed: { increment: commitQty },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: reservation.inventoryItemId,
            type: InventoryMovementType.COMMIT,
            quantity: -commitQty,
            reason: `Stock committed for paid order ${orderId}`,
            referenceType: 'order',
            referenceId: orderId,
            userId,
          },
        });
      }
    });
  }

  async listMovements(params: {
    skip: number;
    take: number;
    inventoryItemId?: string;
    type?: InventoryMovementType;
    referenceId?: string;
  }): Promise<{ data: InventoryMovementWithItem[]; total: number }> {
    const where: Prisma.InventoryMovementWhereInput = {};

    if (params.inventoryItemId) where.inventoryItemId = params.inventoryItemId;
    if (params.type) where.type = params.type;
    if (params.referenceId) where.referenceId = params.referenceId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: MOVEMENT_INCLUDE,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return { data, total };
  }

  async getLowStockItems(): Promise<InventoryItemWithProduct[]> {
    // Get items where available > 0 and filter in code for available <= minStock
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        available: { gt: 0 },
        product: { isActive: true, deletedAt: null },
      },
      include: { product: { select: PRODUCT_INCLUDE } },
      orderBy: { available: 'asc' },
    });

    return items.filter((item) => item.available <= item.minStock);
  }

  async getOutOfStockItems(): Promise<InventoryItemWithProduct[]> {
    return this.prisma.inventoryItem.findMany({
      where: {
        available: 0,
        product: { isActive: true, deletedAt: null },
      },
      include: { product: { select: PRODUCT_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async ensureItemsForProduct(
    productId: string,
    sizes: Size[],
    location = 'MAIN',
  ): Promise<InventoryItem[]> {
    const results: InventoryItem[] = [];

    for (const size of sizes) {
      const existing = await this.prisma.inventoryItem.findUnique({
        where: {
          productId_size_location: { productId, size, location },
        },
      });

      if (existing) {
        results.push(existing);
      } else {
        const created = await this.prisma.inventoryItem.create({
          data: { productId, size, location, available: 0 },
        });
        results.push(created);
      }
    }

    return results;
  }

  async getInventorySummary(): Promise<{
    totalItems: number;
    totalAvailable: number;
    totalReserved: number;
    totalCommitted: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const [aggregates, outOfStockCount, allItems] = await this.prisma.$transaction([
      this.prisma.inventoryItem.aggregate({
        _sum: { available: true, reserved: true, committed: true },
        _count: true,
      }),
      this.prisma.inventoryItem.count({
        where: { available: 0, product: { isActive: true, deletedAt: null } },
      }),
      this.prisma.inventoryItem.findMany({
        where: {
          available: { gt: 0 },
          product: { isActive: true, deletedAt: null },
        },
        select: { available: true, minStock: true },
      }),
    ]);

    const lowStockCount = allItems.filter((i) => i.available <= i.minStock).length;

    return {
      totalItems: aggregates._count,
      totalAvailable: aggregates._sum.available ?? 0,
      totalReserved: aggregates._sum.reserved ?? 0,
      totalCommitted: aggregates._sum.committed ?? 0,
      lowStockCount,
      outOfStockCount,
    };
  }
}
