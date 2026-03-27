import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MERCADOPAGO_PAYMENT_API } from '../domain/ports/mercadopago-payment-api.port';
import { PAYMENT_ORDER_REPOSITORY } from '../domain/ports/payment-order-repository.port';

const mockMpApi = {
  fetchPaymentById: jest.fn(),
  initCheckout: jest.fn(),
};

const mockPaymentOrders = {
  findOrderById: jest.fn(),
  markOrderPaidAtomic: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    process.env.MP_ACCESS_TOKEN = 'test-mp-token';
    process.env.MP_WEBHOOK_SKIP_VERIFY = 'true';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: MERCADOPAGO_PAYMENT_API, useValue: mockMpApi },
        { provide: PAYMENT_ORDER_REPOSITORY, useValue: mockPaymentOrders },
      ],
    }).compile();

    service = module.get(PaymentsService);
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should ignore non-payment webhook types', async () => {
      const result = await service.handleWebhook({ type: 'plan' }, {});
      expect(result).toEqual({ ok: true, ignored: true });
    });

    it('should ignore webhook without data id', async () => {
      const result = await service.handleWebhook({ type: 'payment', data: {} }, {});
      expect(result).toEqual({ ok: true, ignored: true });
    });
  });

  describe('verifyMercadoPagoPayment', () => {
    it('should return alreadyProcessed for duplicate payment', async () => {
      mockMpApi.fetchPaymentById.mockResolvedValue({
        id: 12345,
        status: 'approved',
        transaction_amount: 100,
        external_reference: 'order-1',
      });
      mockPaymentOrders.findOrderById.mockResolvedValue({
        id: 'order-1',
        userId: 'u1',
        total: 100,
        isPaid: true,
        transactionId: '12345',
      });

      const result = await service.verifyMercadoPagoPayment('12345');

      expect(result.alreadyProcessed).toBe(true);
      expect(result.orderId).toBe('order-1');
      expect(mockPaymentOrders.markOrderPaidAtomic).not.toHaveBeenCalled();
    });

    it('should reject if order not found', async () => {
      mockMpApi.fetchPaymentById.mockResolvedValue({
        id: 99,
        status: 'approved',
        transaction_amount: 50,
        external_reference: 'missing-order',
      });
      mockPaymentOrders.findOrderById.mockResolvedValue(null);

      await expect(service.verifyMercadoPagoPayment('99')).rejects.toThrow(NotFoundException);
    });

    it('should reject amount mismatch', async () => {
      mockMpApi.fetchPaymentById.mockResolvedValue({
        id: 100,
        status: 'approved',
        transaction_amount: 50,
        external_reference: 'order-2',
      });
      mockPaymentOrders.findOrderById.mockResolvedValue({
        id: 'order-2',
        userId: 'u1',
        total: 100,
        isPaid: false,
        transactionId: null,
      });

      await expect(service.verifyMercadoPagoPayment('100')).rejects.toThrow(BadRequestException);
    });

    it('should mark order paid on success', async () => {
      mockMpApi.fetchPaymentById.mockResolvedValue({
        id: 200,
        status: 'approved',
        transaction_amount: 75,
        external_reference: 'order-3',
      });
      mockPaymentOrders.findOrderById.mockResolvedValue({
        id: 'order-3',
        userId: 'u1',
        total: 75,
        isPaid: false,
        transactionId: null,
      });
      mockPaymentOrders.markOrderPaidAtomic.mockResolvedValue({ status: 'paid' });

      const result = await service.verifyMercadoPagoPayment('200');
      expect(result.ok).toBe(true);
      expect(mockPaymentOrders.markOrderPaidAtomic).toHaveBeenCalledWith('order-3', '200');
    });

    it('should reject order already paid with different transaction', async () => {
      mockMpApi.fetchPaymentById.mockResolvedValue({
        id: 300,
        status: 'approved',
        transaction_amount: 100,
        external_reference: 'order-4',
      });
      mockPaymentOrders.findOrderById.mockResolvedValue({
        id: 'order-4',
        userId: 'u1',
        total: 100,
        isPaid: true,
        transactionId: '999',
      });

      await expect(service.verifyMercadoPagoPayment('300')).rejects.toThrow(BadRequestException);
    });

    it('should return alreadyProcessed when atomic mark reports already paid', async () => {
      mockMpApi.fetchPaymentById.mockResolvedValue({
        id: 301,
        status: 'approved',
        transaction_amount: 100,
        external_reference: 'order-5',
      });
      mockPaymentOrders.findOrderById.mockResolvedValue({
        id: 'order-5',
        userId: 'u1',
        total: 100,
        isPaid: false,
        transactionId: null,
      });
      mockPaymentOrders.markOrderPaidAtomic.mockResolvedValue({
        status: 'already_paid',
        existingTransactionId: '301',
      });

      const result = await service.verifyMercadoPagoPayment('301');
      expect(result.alreadyProcessed).toBe(true);
    });
  });

  describe('initMercadoPagoCheckout', () => {
    it('returns checkout URL for unpaid own order', async () => {
      mockPaymentOrders.findOrderById.mockResolvedValue({
        id: 'order-10',
        userId: 'user-1',
        total: 199,
        isPaid: false,
        transactionId: null,
      });
      mockMpApi.initCheckout.mockResolvedValue({
        id: 'pref-1',
        initPoint: 'https://mp.example/init',
      });

      const res = await service.initMercadoPagoCheckout('order-10', 'user-1', 'u@example.com');
      expect(res.checkoutUrl).toBe('https://mp.example/init');
    });
  });

  describe('handleWebhook signature', () => {
    it('rejects when verification is required but MP_WEBHOOK_SECRET is missing', async () => {
      delete process.env.MP_WEBHOOK_SKIP_VERIFY;
      delete process.env.MP_WEBHOOK_SECRET;

      await expect(
        service.handleWebhook({ type: 'payment', data: { id: '1' } }, { xSignature: 'a', xRequestId: 'b' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
