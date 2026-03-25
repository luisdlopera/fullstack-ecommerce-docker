import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn()
  }
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    process.env.MP_ACCESS_TOKEN = 'test-mp-token';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should ignore non-payment webhook types', async () => {
      const result = await service.handleWebhook({ type: 'plan' });
      expect(result).toEqual({ ok: true, ignored: true });
    });

    it('should ignore webhook without data id', async () => {
      const result = await service.handleWebhook({ type: 'payment', data: {} });
      expect(result).toEqual({ ok: true, ignored: true });
    });
  });

  describe('idempotency', () => {
    it('should return alreadyProcessed for duplicate payment', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          status: 'approved',
          transaction_amount: 100,
          external_reference: 'order-1'
        })
      } as Response);

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        total: 100,
        isPaid: true,
        transactionId: '12345'
      });

      const result = await service.verifyMercadoPagoPayment('12345');

      expect(result.alreadyProcessed).toBe(true);
      expect(result.orderId).toBe('order-1');
      expect(mockPrisma.order.update).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should reject if order not found', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 99,
          status: 'approved',
          transaction_amount: 50,
          external_reference: 'missing-order'
        })
      } as Response);

      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.verifyMercadoPagoPayment('99')).rejects.toThrow(NotFoundException);

      fetchSpy.mockRestore();
    });

    it('should reject amount mismatch', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 100,
          status: 'approved',
          transaction_amount: 50,
          external_reference: 'order-2'
        })
      } as Response);

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-2',
        total: 100,
        isPaid: false
      });

      await expect(service.verifyMercadoPagoPayment('100')).rejects.toThrow(BadRequestException);

      fetchSpy.mockRestore();
    });
  });
});
