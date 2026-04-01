import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Inventory, Prisma } from '@prisma/client';
import { InventoryMovementType as PrismaMovementType } from '@prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import {
  type InventoryMutationInput,
  type InventoryRecord,
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
  type ReserveByReferenceItem,
  type TransferStockInput,
} from '../../../application/ports/inventory-repository.port';
import { InventoryMovementType } from '../../../domain/enums/inventory-movement-type.enum';

@Injectable()
export class PrismaInventoryRepository implements InventoryRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByProduct(productId: string): Promise<InventoryRecord[]> {
    return this.prisma.inventory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByWarehouse(warehouseId: string): Promise<InventoryRecord[]> {
    return this.prisma.inventory.findMany({
      where: { warehouseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByProductAndWarehouse(productId: string, warehouseId: string): Promise<InventoryRecord | null> {
    return this.prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
  }

  async createOrGet(productId: string, warehouseId: string): Promise<InventoryRecord> {
    return this.prisma.inventory.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId },
      update: {},
    });
  }

  async increase(input: InventoryMutationInput): Promise<InventoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.getOrCreateInventory(tx, input.productId, input.warehouseId);

      const updated = await tx.inventory.update({
        where: { id: current.id },
        data: {
          availableQuantity: { increment: input.quantity },
          lowStockThreshold: input.lowStockThreshold,
          allowNegativeStock: input.allowNegativeStock,
        },
      });

      await this.createMovement(tx, {
        type: InventoryMovementType.IN,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryId: updated.id,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      });

      return updated;
    });
  }

  async decrease(input: InventoryMutationInput): Promise<InventoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.requireInventory(tx, input.productId, input.warehouseId);

      if (current.allowNegativeStock || input.allowNegativeStock === true) {
        const updated = await tx.inventory.update({
          where: { id: current.id },
          data: {
            availableQuantity: { decrement: input.quantity },
            lowStockThreshold: input.lowStockThreshold,
            allowNegativeStock: input.allowNegativeStock,
          },
        });

        await this.createMovement(tx, {
          type: InventoryMovementType.OUT,
          quantity: input.quantity,
          productId: input.productId,
          warehouseId: input.warehouseId,
          inventoryId: updated.id,
          reference: input.reference,
          note: input.note,
          userId: input.userId,
        });

        return updated;
      }

      const updateResult = await tx.inventory.updateMany({
        where: {
          id: current.id,
          availableQuantity: { gte: input.quantity },
        },
        data: {
          availableQuantity: { decrement: input.quantity },
          lowStockThreshold: input.lowStockThreshold,
          allowNegativeStock: input.allowNegativeStock,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('Insufficient stock');
      }

      const updated = await tx.inventory.findUnique({ where: { id: current.id } });
      if (!updated) {
        throw new NotFoundException('Inventory not found after update');
      }

      await this.createMovement(tx, {
        type: InventoryMovementType.OUT,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryId: updated.id,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      });

      return updated;
    });
  }

  async adjust(input: InventoryMutationInput): Promise<InventoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.requireInventory(tx, input.productId, input.warehouseId);

      if (input.quantity < 0 && !current.allowNegativeStock) {
        const absQuantity = Math.abs(input.quantity);
        const updateResult = await tx.inventory.updateMany({
          where: {
            id: current.id,
            availableQuantity: { gte: absQuantity },
          },
          data: {
            availableQuantity: { decrement: absQuantity },
            lowStockThreshold: input.lowStockThreshold,
          },
        });

        if (updateResult.count === 0) {
          throw new ConflictException('Insufficient stock for adjustment');
        }
      } else if (input.quantity < 0) {
        await tx.inventory.update({
          where: { id: current.id },
          data: {
            availableQuantity: { decrement: Math.abs(input.quantity) },
            lowStockThreshold: input.lowStockThreshold,
          },
        });
      } else {
        await tx.inventory.update({
          where: { id: current.id },
          data: {
            availableQuantity: { increment: input.quantity },
            lowStockThreshold: input.lowStockThreshold,
          },
        });
      }

      const updated = await tx.inventory.findUnique({ where: { id: current.id } });
      if (!updated) {
        throw new NotFoundException('Inventory not found after update');
      }

      await this.createMovement(tx, {
        type: InventoryMovementType.ADJUSTMENT,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryId: updated.id,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      });

      return updated;
    });
  }

  async reserve(input: InventoryMutationInput): Promise<InventoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.requireInventory(tx, input.productId, input.warehouseId);

      const updateResult = await tx.inventory.updateMany({
        where: {
          id: current.id,
          availableQuantity: { gte: input.quantity },
        },
        data: {
          availableQuantity: { decrement: input.quantity },
          reservedQuantity: { increment: input.quantity },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('Insufficient available stock to reserve');
      }

      const updated = await tx.inventory.findUnique({ where: { id: current.id } });
      if (!updated) {
        throw new NotFoundException('Inventory not found after reserve');
      }

      await this.createMovement(tx, {
        type: InventoryMovementType.RESERVE,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryId: updated.id,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      });

      return updated;
    });
  }

  async release(input: InventoryMutationInput): Promise<InventoryRecord> {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.requireInventory(tx, input.productId, input.warehouseId);

      const updateResult = await tx.inventory.updateMany({
        where: {
          id: current.id,
          reservedQuantity: { gte: input.quantity },
        },
        data: {
          reservedQuantity: { decrement: input.quantity },
          availableQuantity: { increment: input.quantity },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('Insufficient reserved stock to release');
      }

      const updated = await tx.inventory.findUnique({ where: { id: current.id } });
      if (!updated) {
        throw new NotFoundException('Inventory not found after release');
      }

      await this.createMovement(tx, {
        type: InventoryMovementType.RELEASE,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryId: updated.id,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      });

      return updated;
    });
  }

  async transfer(input: TransferStockInput): Promise<{ source: InventoryRecord; target: InventoryRecord }> {
    return this.prisma.$transaction(async (tx) => {
      const source = await this.requireInventory(tx, input.productId, input.sourceWarehouseId);
      const target = await this.getOrCreateInventory(tx, input.productId, input.targetWarehouseId);

      if (!source.allowNegativeStock) {
        const sourceUpdateResult = await tx.inventory.updateMany({
          where: {
            id: source.id,
            availableQuantity: { gte: input.quantity },
          },
          data: {
            availableQuantity: { decrement: input.quantity },
          },
        });

        if (sourceUpdateResult.count === 0) {
          throw new ConflictException('Insufficient stock in source warehouse');
        }
      } else {
        await tx.inventory.update({
          where: { id: source.id },
          data: {
            availableQuantity: { decrement: input.quantity },
          },
        });
      }

      await tx.inventory.update({
        where: { id: target.id },
        data: {
          availableQuantity: { increment: input.quantity },
        },
      });

      const [updatedSource, updatedTarget] = await Promise.all([
        tx.inventory.findUnique({ where: { id: source.id } }),
        tx.inventory.findUnique({ where: { id: target.id } }),
      ]);

      if (!updatedSource || !updatedTarget) {
        throw new NotFoundException('Inventory not found after transfer');
      }

      await this.createMovement(tx, {
        type: InventoryMovementType.TRANSFER,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.sourceWarehouseId,
        sourceWarehouseId: null,
        inventoryId: updatedSource.id,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      });

      await this.createMovement(tx, {
        type: InventoryMovementType.TRANSFER,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.targetWarehouseId,
        sourceWarehouseId: input.sourceWarehouseId,
        inventoryId: updatedTarget.id,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      });

      return {
        source: updatedSource,
        target: updatedTarget,
      };
    });
  }

  async validateAvailableStock(productId: string, warehouseId: string, quantity: number): Promise<boolean> {
    const inventory = await this.findByProductAndWarehouse(productId, warehouseId);
    if (!inventory) {
      return false;
    }

    if (inventory.allowNegativeStock) {
      return true;
    }

    return inventory.availableQuantity >= quantity;
  }

  async reserveManyByReference(items: ReserveByReferenceItem[], reference: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inventory = await this.requireInventory(tx, item.productId, item.warehouseId);

        const updated = await tx.inventory.updateMany({
          where: {
            id: inventory.id,
            availableQuantity: { gte: item.quantity },
          },
          data: {
            availableQuantity: { decrement: item.quantity },
            reservedQuantity: { increment: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new ConflictException('Insufficient stock to reserve by reference');
        }

        await this.createMovement(tx, {
          type: InventoryMovementType.RESERVE,
          quantity: item.quantity,
          productId: item.productId,
          warehouseId: item.warehouseId,
          inventoryId: inventory.id,
          reference,
          note: 'Reserved by reference',
          userId,
        });
      }
    });
  }

  async releaseByReference(reference: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const reserveMovements = await tx.stockMovement.findMany({
        where: {
          reference,
          type: PrismaMovementType.RESERVE,
        },
      });

      if (reserveMovements.length === 0) {
        return;
      }

      const commitCount = await tx.stockMovement.count({
        where: {
          reference,
          type: PrismaMovementType.COMMIT,
        },
      });

      if (commitCount > 0) {
        return;
      }

      const releaseCount = await tx.stockMovement.count({
        where: {
          reference,
          type: PrismaMovementType.RELEASE,
        },
      });

      if (releaseCount > 0) {
        return;
      }

      for (const movement of reserveMovements) {
        const updated = await tx.inventory.updateMany({
          where: {
            id: movement.inventoryId,
            reservedQuantity: { gte: movement.quantity },
          },
          data: {
            reservedQuantity: { decrement: movement.quantity },
            availableQuantity: { increment: movement.quantity },
          },
        });

        if (updated.count === 0) {
          throw new ConflictException('Unable to release reserved stock');
        }

        await this.createMovement(tx, {
          type: InventoryMovementType.RELEASE,
          quantity: movement.quantity,
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          inventoryId: movement.inventoryId,
          reference,
          note: 'Released by reference',
          userId,
        });
      }
    });
  }

  async commitByReference(reference: string, userId?: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const reserveMovements = await tx.stockMovement.findMany({
        where: {
          reference,
          type: PrismaMovementType.RESERVE,
        },
      });

      if (reserveMovements.length === 0) {
        return;
      }

      const commitCount = await tx.stockMovement.count({
        where: {
          reference,
          type: PrismaMovementType.COMMIT,
        },
      });

      if (commitCount > 0) {
        return;
      }

      for (const movement of reserveMovements) {
        const updated = await tx.inventory.updateMany({
          where: {
            id: movement.inventoryId,
            reservedQuantity: { gte: movement.quantity },
          },
          data: {
            reservedQuantity: { decrement: movement.quantity },
          },
        });

        if (updated.count === 0) {
          throw new ConflictException('Unable to commit reserved stock');
        }

        await this.createMovement(tx, {
          type: InventoryMovementType.COMMIT,
          quantity: movement.quantity,
          productId: movement.productId,
          warehouseId: movement.warehouseId,
          inventoryId: movement.inventoryId,
          reference,
          note: 'Committed by reference',
          userId,
        });
      }
    });
  }

  movementTypeEnumValue(type: InventoryMovementType): string {
    return type;
  }

  private async getOrCreateInventory(
    tx: Prisma.TransactionClient,
    productId: string,
    warehouseId: string,
  ): Promise<Inventory> {
    return tx.inventory.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId },
      update: {},
    });
  }

  private async requireInventory(
    tx: Prisma.TransactionClient,
    productId: string,
    warehouseId: string,
  ): Promise<Inventory> {
    const inventory = await tx.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }

    return inventory;
  }

  private async createMovement(
    tx: Prisma.TransactionClient,
    input: {
      type: InventoryMovementType;
      quantity: number;
      productId: string;
      warehouseId: string;
      sourceWarehouseId?: string | null;
      inventoryId: string;
      reference?: string;
      note?: string;
      userId?: string;
    },
  ): Promise<void> {
    await tx.stockMovement.create({
      data: {
        type: input.type as PrismaMovementType,
        quantity: input.quantity,
        productId: input.productId,
        warehouseId: input.warehouseId,
        sourceWarehouseId: input.sourceWarehouseId,
        inventoryId: input.inventoryId,
        reference: input.reference,
        note: input.note,
        userId: input.userId,
      },
    });
  }
}

export const INVENTORY_REPOSITORY_PROVIDER = {
  provide: INVENTORY_REPOSITORY,
  useClass: PrismaInventoryRepository,
};
