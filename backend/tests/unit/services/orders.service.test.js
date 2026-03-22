/**
 * Unit tests for: OrdersService
 * Module path:    src/services/orders.service.js
 * Created:        2026-03-22
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    ADMIN_WHATSAPP: '910000000000',
    WHATSAPP_ENABLED: false,
  },
}));

vi.mock('../../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../../src/repositories/order.repository.js', () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findWithPagination: vi.fn(),
  countOrders: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock('../../../src/repositories/product.repository.js', () => ({
  findByIds: vi.fn(),
}));

vi.mock('../../../src/repositories/admin.repository.js', () => ({
  findOneAdmin: vi.fn(),
}));

vi.mock('../../../src/services/whatsapp.service.js', () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue(true),
  sendWhatsAppDocument: vi.fn().mockResolvedValue(true),
  getWAStatus: vi.fn().mockReturnValue({ isReady: false }),
}));

vi.mock('../../../src/utils/helpers.js', () => ({
  buildAdminMessage: vi.fn().mockReturnValue('Admin message'),
  buildCustomerMessage: vi.fn().mockReturnValue('Customer message'),
  makeSlug: vi.fn(),
  parseCollections: vi.fn(),
  numberToWords: vi.fn(),
}));

vi.mock('../../../src/utils/generate-invoice-pdf.js', () => ({
  default: vi.fn().mockResolvedValue({
    fileUrl: '/uploads/invoices/ADI-0001.pdf',
    filePath: '/some/path/ADI-0001.pdf',
  }),
}));

vi.mock('mongoose', () => ({
  default: {
    connection: {
      db: {
        admin: vi.fn(() => ({
          command: vi.fn().mockRejectedValue(new Error('not a replica set')),
        })),
      },
    },
    startSession: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

import * as orderRepo from '../../../src/repositories/order.repository.js';
import * as productRepo from '../../../src/repositories/product.repository.js';
import * as waService from '../../../src/services/whatsapp.service.js';
import { createOrder, getOrderById, getOrderInvoice } from '../../../src/services/orders.service.js';
import { ApiError } from '../../../src/utils/api-error.js';

// ── Fixtures ───────────────────────────────────────────────────────────────────
const buildCustomer = (overrides = {}) => ({
  name: 'Jane Doe',
  phone: '9876543210',
  whatsapp: '9876543210',
  address: '456 Park Ave',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
  ...overrides,
});

const buildCartItem = (overrides = {}) => ({
  productId: 'prod-001',
  quantity: 2,
  ...overrides,
});

const buildProduct = (overrides = {}) => ({
  _id: { toString: () => 'prod-001' },
  name: 'Test Product',
  itemCode: 'TP-001',
  hsnCode: '6211',
  place: 'Surat',
  salesPrice: 500,
  unitConversionRate: 10,
  ...overrides,
});

const buildOrder = (overrides = {}) => ({
  _id: 'order-id-001',
  orderId: 'ADI-0001',
  customer: buildCustomer(),
  items: [{ name: 'Test Product', quantity: 2, price: 500, amount: 1000 }],
  total: 1000,
  subtotal: 1000,
  paymentMode: 'Credit',
  createdAt: new Date('2024-01-15'),
  ...overrides,
});

describe('orders.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    waService.getWAStatus.mockReturnValue({ isReady: false });
  });

  // ── createOrder ────────────────────────────────────────────────────────────
  describe('createOrder', () => {
    beforeEach(() => {
      productRepo.findByIds.mockResolvedValue([buildProduct()]);
      orderRepo.create.mockResolvedValue(buildOrder());
    });

    it('should create an order with computed items and totals', async () => {
      const result = await createOrder({
        customer: buildCustomer(),
        items: [buildCartItem()],
        paymentMode: 'Credit',
      });

      expect(orderRepo.create).toHaveBeenCalledTimes(1);
      const [orderData] = orderRepo.create.mock.calls[0];
      expect(orderData.customer).toEqual(expect.objectContaining({ name: 'Jane Doe' }));
      expect(orderData.items).toHaveLength(1);
      expect(orderData.subtotal).toBe(1000); // 500 * 2
      expect(orderData.total).toBe(1000);
    });

    it('should default paymentMode to "Credit" when not provided', async () => {
      await createOrder({
        customer: buildCustomer(),
        items: [buildCartItem()],
      });

      const [orderData] = orderRepo.create.mock.calls[0];
      expect(orderData.paymentMode).toBe('Credit');
    });

    it('should return the created order and pdfUrl', async () => {
      const result = await createOrder({
        customer: buildCustomer(),
        items: [buildCartItem()],
        paymentMode: 'UPI',
      });

      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('pdfUrl');
      expect(result).toHaveProperty('autoSent');
    });

    it('should throw 404 ApiError when a cart item references a non-existent product', async () => {
      productRepo.findByIds.mockResolvedValue([]); // product not found

      await expect(
        createOrder({
          customer: buildCustomer(),
          items: [buildCartItem({ productId: 'nonexistent' })],
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should fetch all product IDs in a single batch query', async () => {
      const items = [buildCartItem({ productId: 'p1' }), buildCartItem({ productId: 'p2' })];
      productRepo.findByIds.mockResolvedValue([
        buildProduct({ _id: { toString: () => 'p1' } }),
        buildProduct({ _id: { toString: () => 'p2' } }),
      ]);

      await createOrder({ customer: buildCustomer(), items });

      expect(productRepo.findByIds).toHaveBeenCalledWith(['p1', 'p2'], { session: null });
      expect(productRepo.findByIds).toHaveBeenCalledTimes(1);
    });

    it('should NOT send WhatsApp messages when WA is not ready', async () => {
      waService.getWAStatus.mockReturnValue({ isReady: false });

      const result = await createOrder({
        customer: buildCustomer(),
        items: [buildCartItem()],
      });

      expect(waService.sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(result.autoSent.waReady).toBe(false);
    });

    it('should send WhatsApp messages when WA is ready', async () => {
      const { findOneAdmin } = await import('../../../src/repositories/admin.repository.js');
      findOneAdmin.mockResolvedValue({ whatsappNumber: '919999999999' });
      waService.getWAStatus.mockReturnValue({ isReady: true });

      await createOrder({
        customer: buildCustomer(),
        items: [buildCartItem()],
      });

      expect(waService.sendWhatsAppMessage).toHaveBeenCalledTimes(2);
    });

    it('should set gstTotal to 0', async () => {
      await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      const [orderData] = orderRepo.create.mock.calls[0];
      expect(orderData.gstTotal).toBe(0);
    });
  });

  // ── getOrderById ───────────────────────────────────────────────────────────
  describe('getOrderById', () => {
    it('should return the order when found', async () => {
      const order = buildOrder();
      orderRepo.findById.mockResolvedValue(order);

      const result = await getOrderById('ADI-0001');

      expect(result).toEqual(order);
      expect(orderRepo.findById).toHaveBeenCalledWith('ADI-0001');
    });

    it('should throw 404 ApiError when order is not found', async () => {
      orderRepo.findById.mockResolvedValue(null);

      await expect(getOrderById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Order not found',
      });
    });
  });

  // ── getOrderInvoice ────────────────────────────────────────────────────────
  describe('getOrderInvoice', () => {
    it('should return order and filePath when order exists', async () => {
      const order = buildOrder();
      orderRepo.findById.mockResolvedValue(order);

      const result = await getOrderInvoice('ADI-0001');

      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('filePath');
      expect(result.order).toEqual(order);
    });

    it('should throw 404 ApiError when order is not found', async () => {
      orderRepo.findById.mockResolvedValue(null);

      await expect(getOrderInvoice('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Order not found',
      });
    });
  });
});
