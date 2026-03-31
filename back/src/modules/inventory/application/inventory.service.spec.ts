import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import type {
  InventoryRepositoryPort,
  ReserveLineItem,
} from '../domain/ports/inventory-repository.port';
import type { InventoryItem, Size as PrismaSize } from '@prisma/client';

const Size = {
  S: 'S' as PrismaSize,
  M: 'M' as PrismaSize,
  L: 'L' as PrismaSize,
};

function createMockRepo(): jest.Mocked<InventoryRepositoryPort> {
  return {
    listItems: jest.fn(),
    getItemById: jest.fn(),
    getItemsByProductId: jest.fn(),
    adjustInventory: jest.fn(),
    reserveStock: jest.fn(),
    releaseStock: jest.fn(),
    commitStock: jest.fn(),
    listMovements: jest.fn(),
    getLowStockItems: jest.fn(),
    getOutOfStockItems: jest.fn(),
    ensureItemsForProduct: jest.fn(),
    getInventorySummary: jest.fn(),
  };
}

function createMockItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    productId: 'prod-1',
    size: Size.M,
    location: 'MAIN',
    available: 10,
    reserved: 0,
    committed: 0,
    minStock: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: jest.Mocked<InventoryRepositoryPort>;

  beforeEach(() => {
    repo = createMockRepo();
    service = new InventoryService(repo);
  });

  // ─── adjustInventory ──────────────────────────────────────────────

  describe('adjustInventory', () => {
    it('should adjust inventory with positive quantity', async () => {
      const item = createMockItem({ available: 15 });
      repo.adjustInventory.mockResolvedValue(item);

      const result = await service.adjustInventory('item-1', 5, 'Restock from supplier', 'user-1');

      expect(repo.adjustInventory).toHaveBeenCalledWith('item-1', 5, 'Restock from supplier', 'user-1');
      expect(result.available).toBe(15);
    });

    it('should adjust inventory with negative quantity', async () => {
      const item = createMockItem({ available: 7 });
      repo.adjustInventory.mockResolvedValue(item);

      const result = await service.adjustInventory('item-1', -3, 'Damaged goods', 'user-1');

      expect(repo.adjustInventory).toHaveBeenCalledWith('item-1', -3, 'Damaged goods', 'user-1');
      expect(result).toEqual(item);
    });

    it('should reject adjustment with empty reason', async () => {
      await expect(
        service.adjustInventory('item-1', 5, '  ', 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(repo.adjustInventory).not.toHaveBeenCalled();
    });

    it('should reject adjustment with zero quantity', async () => {
      await expect(
        service.adjustInventory('item-1', 0, 'Some reason', 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(repo.adjustInventory).not.toHaveBeenCalled();
    });
  });

  // ─── reserveStock ──────────────────────────────────────────────────

  describe('reserveStock', () => {
    it('should reserve stock for valid items', async () => {
      repo.reserveStock.mockResolvedValue(undefined);

      const items: ReserveLineItem[] = [
        { productId: 'prod-1', size: Size.M, quantity: 2 },
        { productId: 'prod-1', size: Size.L, quantity: 1 },
      ];

      await service.reserveStock(items, 'order-1', 'user-1');

      expect(repo.reserveStock).toHaveBeenCalledWith(items, 'order-1', 'user-1');
    });

    it('should reject empty items array', async () => {
      await expect(
        service.reserveStock([], 'order-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(repo.reserveStock).not.toHaveBeenCalled();
    });

    it('should propagate repository errors (insufficient stock)', async () => {
      repo.reserveStock.mockRejectedValue(
        new BadRequestException('Insufficient stock for product prod-1 size M'),
      );

      await expect(
        service.reserveStock(
          [{ productId: 'prod-1', size: Size.M, quantity: 100 }],
          'order-1',
          'user-1',
        ),
      ).rejects.toThrow('Insufficient stock');
    });
  });

  // ─── releaseStock ──────────────────────────────────────────────────

  describe('releaseStock', () => {
    it('should release stock for an order', async () => {
      repo.releaseStock.mockResolvedValue(undefined);

      await service.releaseStock('order-1', 'user-1');

      expect(repo.releaseStock).toHaveBeenCalledWith('order-1', 'user-1');
    });
  });

  // ─── commitStock ──────────────────────────────────────────────────

  describe('commitStock', () => {
    it('should commit stock for an order', async () => {
      repo.commitStock.mockResolvedValue(undefined);

      await service.commitStock('order-1', 'user-1');

      expect(repo.commitStock).toHaveBeenCalledWith('order-1', 'user-1');
    });
  });

  // ─── listMovements ────────────────────────────────────────────────

  describe('listMovements', () => {
    it('should list movements with pagination', async () => {
      repo.listMovements.mockResolvedValue({ data: [], total: 0 });

      const result = await service.listMovements(1, 20, 'item-1');

      expect(repo.listMovements).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        inventoryItemId: 'item-1',
        type: undefined,
        referenceId: undefined,
      });
      expect(result.meta.page).toBe(1);
    });

    it('should enforce pagination limits', async () => {
      repo.listMovements.mockResolvedValue({ data: [], total: 0 });

      await service.listMovements(0, 200);

      expect(repo.listMovements).toHaveBeenCalledWith({
        skip: 0,
        take: 100, // max limit
        inventoryItemId: undefined,
        type: undefined,
        referenceId: undefined,
      });
    });
  });

  // ─── getInventorySummary ──────────────────────────────────────────

  describe('getInventorySummary', () => {
    it('should return summary stats', async () => {
      const mockSummary = {
        totalItems: 50,
        totalAvailable: 200,
        totalReserved: 15,
        totalCommitted: 30,
        lowStockCount: 5,
        outOfStockCount: 3,
      };
      repo.getInventorySummary.mockResolvedValue(mockSummary);

      const result = await service.getInventorySummary();

      expect(result).toEqual(mockSummary);
    });
  });
});
