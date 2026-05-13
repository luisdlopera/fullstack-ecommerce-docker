import { PrismaOrdersRepository } from './prisma-orders.repository';
import type { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

describe('PrismaOrdersRepository', () => {
  const originalDefaultWarehouseId = process.env.DEFAULT_WAREHOUSE_ID;

  afterEach(() => {
    if (originalDefaultWarehouseId === undefined) {
      delete process.env.DEFAULT_WAREHOUSE_ID;
    } else {
      process.env.DEFAULT_WAREHOUSE_ID = originalDefaultWarehouseId;
    }
    jest.clearAllMocks();
  });

  it('validates cart stock against the configured default warehouse', async () => {
    process.env.DEFAULT_WAREHOUSE_ID = 'warehouse-1';
    const prisma = {
      inventory: {
        findUnique: jest.fn().mockResolvedValue({ availableQuantity: 3 }),
      },
    } as unknown as PrismaService;
    const repository = new PrismaOrdersRepository(prisma);

    const result = await repository.validateCartStock([{ productId: 'product-1', size: 'M', quantity: 2 }]);

    expect(result).toEqual({ valid: true, errors: [] });
    expect(prisma.inventory.findUnique).toHaveBeenCalledWith({
      where: {
        productId_warehouseId: {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
        },
      },
      select: { availableQuantity: true },
    });
  });

  it('fails fast when the default warehouse is not configured', async () => {
    delete process.env.DEFAULT_WAREHOUSE_ID;
    const prisma = {
      inventory: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;
    const repository = new PrismaOrdersRepository(prisma);

    await expect(repository.validateCartStock([{ productId: 'product-1', size: 'M', quantity: 1 }])).rejects.toThrow(
      'DEFAULT_WAREHOUSE_ID is required for cart stock validation',
    );
    expect(prisma.inventory.findUnique).not.toHaveBeenCalled();
  });
});
