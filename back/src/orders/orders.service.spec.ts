import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

const mockTx = {
  product: {
    updateMany: jest.fn().mockResolvedValue({ count: 1 })
  },
  order: {
    create: jest.fn()
  }
};

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    update: jest.fn()
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  orderItem: {
    findMany: jest.fn()
  },
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    process.env.TAX_RATE = '0.15';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if product does not exist', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.create('user-1', {
          items: [{ productId: 'p1', quantity: 1, size: 'M' as never }],
          address: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 St',
            postalCode: '00000',
            city: 'City',
            phone: '1234567',
            countryId: 'CO'
          }
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should transition from pending to shipped (admin)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.pending,
        userId: 'user-1',
        isPaid: true
      });
      mockPrisma.order.update.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.shipped
      });

      const result = await service.updateStatus('o1', OrderStatus.shipped, 'admin-1', 'admin' as never);

      expect(result.status).toBe(OrderStatus.shipped);
    });

    it('should reject invalid transition (delivered -> pending)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.delivered,
        userId: 'user-1'
      });

      await expect(
        service.updateStatus('o1', OrderStatus.pending, 'admin-1', 'admin' as never)
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow user to cancel their own pending order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.pending,
        userId: 'user-1',
        isPaid: false
      });
      mockPrisma.orderItem.findMany.mockResolvedValue([
        { productId: 'p1', quantity: 2 }
      ]);
      mockPrisma.product.update.mockResolvedValue({});
      mockPrisma.order.update.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.cancelled
      });

      const result = await service.updateStatus('o1', OrderStatus.cancelled, 'user-1', 'user' as never);

      expect(result.status).toBe(OrderStatus.cancelled);
      expect(mockPrisma.product.update).toHaveBeenCalled();
    });

    it('should reject non-owner user trying to cancel', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.pending,
        userId: 'user-1'
      });

      await expect(
        service.updateStatus('o1', OrderStatus.cancelled, 'user-2', 'user' as never)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for missing order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing', OrderStatus.shipped, 'admin-1', 'admin' as never)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('should return order for owner', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        userId: 'user-1'
      });

      const result = await service.getById('o1', 'user-1', 'user' as never);
      expect(result.id).toBe('o1');
    });

    it('should throw ForbiddenException for non-owner non-admin', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        userId: 'user-1'
      });

      await expect(
        service.getById('o1', 'user-2', 'user' as never)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        userId: 'user-1'
      });

      const result = await service.getById('o1', 'admin-1', 'admin' as never);
      expect(result.id).toBe('o1');
    });
  });
});
