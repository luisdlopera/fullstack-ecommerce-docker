import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../domain/ports/orders-repository.port';

const mockRepo: jest.Mocked<OrdersRepositoryPort> = {
  findProductsByIds: jest.fn(),
  createOrderWithStockTx: jest.fn(),
  findOrdersForUser: jest.fn(),
  findOrderDetailById: jest.fn(),
  findOrderBasic: jest.fn(),
  updateOrderById: jest.fn(),
  markOrderPaid: jest.fn(),
  listOrderItemsForStock: jest.fn(),
  incrementProductStock: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    process.env.TAX_RATE = '0.15';

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: ORDERS_REPOSITORY, useValue: mockRepo }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if product does not exist', async () => {
      mockRepo.findProductsByIds.mockResolvedValue([]);

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
            countryId: 'CO',
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should transition from PENDING to SHIPPED (admin)', async () => {
      mockRepo.findOrderBasic.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.PENDING,
        userId: 'user-1',
        isPaid: true,
        subTotal: 0,
        tax: 0,
        total: 0,
        itemsInOrder: 0,
        paidAt: null,
        paymentStatus: 'PENDING' as never,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId_dup: 'user-1',
      } as never);

      await expect(service.updateStatus('o1', OrderStatus.SHIPPED, 'admin-1', Role.ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid transition (DELIVERED -> PENDING)', async () => {
      mockRepo.findOrderBasic.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.DELIVERED,
        userId: 'user-1',
        isPaid: true,
        subTotal: 0,
        tax: 0,
        total: 0,
        itemsInOrder: 0,
        paidAt: null,
        paymentStatus: 'PAID' as never,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      await expect(service.updateStatus('o1', OrderStatus.PENDING, 'admin-1', Role.ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow user to cancel their own PENDING order', async () => {
      mockRepo.findOrderBasic.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.PENDING,
        userId: 'user-1',
        isPaid: false,
        subTotal: 0,
        tax: 0,
        total: 0,
        itemsInOrder: 0,
        paidAt: null,
        paymentStatus: 'PENDING' as never,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);
      mockRepo.listOrderItemsForStock.mockResolvedValue([{ productId: 'p1', quantity: 2 }]);
      mockRepo.incrementProductStock.mockResolvedValue(undefined);
      mockRepo.updateOrderById.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.CANCELLED,
        OrderItem: [],
        OrderAddress: null,
      } as never);

      const result = await service.updateStatus('o1', OrderStatus.CANCELLED, 'user-1', Role.USER);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockRepo.incrementProductStock).toHaveBeenCalledWith('p1', 2);
    });

    it('should reject non-owner user trying to cancel', async () => {
      mockRepo.findOrderBasic.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.PENDING,
        userId: 'user-1',
        isPaid: false,
        subTotal: 0,
        tax: 0,
        total: 0,
        itemsInOrder: 0,
        paidAt: null,
        paymentStatus: 'PENDING' as never,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      await expect(service.updateStatus('o1', OrderStatus.CANCELLED, 'user-2', Role.USER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException for missing order', async () => {
      mockRepo.findOrderBasic.mockResolvedValue(null);

      await expect(service.updateStatus('missing', OrderStatus.SHIPPED, 'admin-1', Role.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getById', () => {
    it('should return order for owner', async () => {
      mockRepo.findOrderDetailById.mockResolvedValue({
        id: 'o1',
        userId: 'user-1',
      } as never);

      const result = await service.getById('o1', 'user-1', Role.USER);
      expect(result.id).toBe('o1');
    });

    it('should throw ForbiddenException for non-owner non-admin', async () => {
      mockRepo.findOrderDetailById.mockResolvedValue({
        id: 'o1',
        userId: 'user-1',
      } as never);

      await expect(service.getById('o1', 'user-2', Role.USER)).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to access any order', async () => {
      mockRepo.findOrderDetailById.mockResolvedValue({
        id: 'o1',
        userId: 'user-1',
      } as never);

      const result = await service.getById('o1', 'admin-1', Role.ADMIN);
      expect(result.id).toBe('o1');
    });
  });
});
