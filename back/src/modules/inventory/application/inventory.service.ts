import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { InventoryMovementType, Size } from '@prisma/client';
import {
  INVENTORY_REPOSITORY,
  type InventoryRepositoryPort,
  type ReserveLineItem,
} from '../domain/ports/inventory-repository.port';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repo: InventoryRepositoryPort,
  ) {}

  // ─── List Items ──────────────────────────────────────────────────────

  async listItems(
    page = 1,
    limit = 20,
    search?: string,
    lowStock?: boolean,
    outOfStock?: boolean,
    productId?: string,
    location?: string,
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const { data, total } = await this.repo.listItems({
      skip,
      take: safeLimit,
      search,
      lowStock,
      outOfStock,
      productId,
      location,
    });

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }

  // ─── Get Item ────────────────────────────────────────────────────────

  async getItemById(itemId: string) {
    const item = await this.repo.getItemById(itemId);
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  // ─── Get Items by Product ────────────────────────────────────────────

  async getItemsByProductId(productId: string) {
    return this.repo.getItemsByProductId(productId);
  }

  // ─── Adjust Inventory ────────────────────────────────────────────────

  async adjustInventory(
    itemId: string,
    quantity: number,
    reason: string,
    userId: string,
  ) {
    if (!reason.trim()) {
      throw new BadRequestException('Reason is required for inventory adjustments');
    }

    if (quantity === 0) {
      throw new BadRequestException('Adjustment quantity cannot be zero');
    }

    return this.repo.adjustInventory(itemId, quantity, reason.trim(), userId);
  }

  // ─── Reserve Stock ───────────────────────────────────────────────────

  async reserveStock(
    items: ReserveLineItem[],
    orderId: string,
    userId: string,
  ) {
    if (items.length === 0) {
      throw new BadRequestException('No items to reserve');
    }

    return this.repo.reserveStock(items, orderId, userId);
  }

  // ─── Release Stock ───────────────────────────────────────────────────

  async releaseStock(orderId: string, userId: string) {
    return this.repo.releaseStock(orderId, userId);
  }

  // ─── Commit Stock ────────────────────────────────────────────────────

  async commitStock(orderId: string, userId: string) {
    return this.repo.commitStock(orderId, userId);
  }

  // ─── Movements ───────────────────────────────────────────────────────

  async listMovements(
    page = 1,
    limit = 20,
    inventoryItemId?: string,
    type?: InventoryMovementType,
    referenceId?: string,
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const { data, total } = await this.repo.listMovements({
      skip,
      take: safeLimit,
      inventoryItemId,
      type,
      referenceId,
    });

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }

  // ─── Alerts ──────────────────────────────────────────────────────────

  async getLowStockItems() {
    return this.repo.getLowStockItems();
  }

  async getOutOfStockItems() {
    return this.repo.getOutOfStockItems();
  }

  // ─── Ensure Items ────────────────────────────────────────────────────

  async ensureItemsForProduct(
    productId: string,
    sizes: Size[],
    location?: string,
  ) {
    return this.repo.ensureItemsForProduct(productId, sizes, location);
  }

  // ─── Summary ─────────────────────────────────────────────────────────

  async getInventorySummary() {
    return this.repo.getInventorySummary();
  }
}
