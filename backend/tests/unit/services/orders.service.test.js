/**
 * Unit tests for: OrdersService
 * Module path:    src/services/orders.service.js
 * Created:        2026-03-22
 * Updated:        2026-03-24 — CDN ImageKit migration (invoices uploaded to ImageKit, not local disk)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/env.js', () => ({
  env: {
    JWT_SECRET:       'test-secret',
    ADMIN_WHATSAPP:   '910000000000',
    WHATSAPP_ENABLED: false,
  },
}));

vi.mock('../../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../../src/repositories/order.repository.js', () => ({
  create:             vi.fn(),
  findById:           vi.fn(),
  update:             vi.fn().mockResolvedValue({}),
  findWithPagination: vi.fn(),
  countOrders:        vi.fn(),
  updateStatus:       vi.fn(),
}));

vi.mock('../../../src/repositories/product.repository.js', () => ({
  findByIds: vi.fn(),
}));

vi.mock('../../../src/repositories/admin.repository.js', () => ({
  findOneAdmin: vi.fn(),
}));

vi.mock('../../../src/services/whatsapp.service.js', () => ({
  sendWhatsAppMessage:        vi.fn().mockResolvedValue(true),
  sendWhatsAppDocumentBuffer: vi.fn().mockResolvedValue(true),
  getWAStatus:                vi.fn().mockReturnValue({ isReady: false }),
}));

vi.mock('../../../src/services/imagekit.service.js', () => ({
  uploadInvoicePdf: vi.fn().mockResolvedValue({
    url:    'https://ik.imagekit.io/test/adiyogi/invoices/invoice-ADI-0001-uuid.pdf',
    fileId: 'invoice-fid-001',
  }),
}));

vi.mock('../../../src/utils/helpers.js', () => ({
  buildAdminMessage:   vi.fn().mockReturnValue('Admin message'),
  buildCustomerMessage: vi.fn().mockReturnValue('Customer message'),
  makeSlug:            vi.fn(),
  parseCollections:    vi.fn(),
  numberToWords:       vi.fn(),
}));

vi.mock('../../../src/utils/generate-invoice-pdf.js', () => ({
  default: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
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

import * as orderRepo from '../../../src/repositories/order.repository.js';
import * as productRepo from '../../../src/repositories/product.repository.js';
import * as waService from '../../../src/services/whatsapp.service.js';
import * as imagekitService from '../../../src/services/imagekit.service.js';
import { createOrder, getOrderById, getOrderInvoice } from '../../../src/services/orders.service.js';

// ── Fixtures ───────────────────────────────────────────────────────────────────
const buildCustomer = (overrides = {}) => ({
  name:     'Jane Doe',
  phone:    '9876543210',
  whatsapp: '9876543210',
  address:  '456 Park Ave',
  city:     'Delhi',
  state:    'Delhi',
  pincode:  '110001',
  ...overrides,
});

const buildCartItem = (overrides = {}) => ({
  productId: 'prod-001',
  quantity:  2,
  ...overrides,
});

const buildProduct = (overrides = {}) => ({
  _id:               { toString: () => 'prod-001' },
  name:              'Test Product',
  itemCode:          'TP-001',
  hsnCode:           '6211',
  place:             'Surat',
  salesPrice:        500,
  unitConversionRate: 10,
  ...overrides,
});

const buildOrder = (overrides = {}) => ({
  _id:         'order-id-001',
  orderId:     'ADI-0001',
  customer:    buildCustomer(),
  items:       [{ name: 'Test Product', quantity: 2, price: 500, amount: 1000 }],
  total:       1000,
  subtotal:    1000,
  paymentMode: 'Credit',
  createdAt:   new Date('2024-01-15'),
  invoiceUrl:  null,
  invoiceFileId: null,
  ...overrides,
});

const INVOICE_CDN_URL = 'https://ik.imagekit.io/test/adiyogi/invoices/invoice-ADI-0001-uuid.pdf';

describe('orders.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    waService.getWAStatus.mockReturnValue({ isReady: false });
    orderRepo.update.mockResolvedValue({});
    imagekitService.uploadInvoicePdf.mockResolvedValue({
      url:    INVOICE_CDN_URL,
      fileId: 'invoice-fid-001',
    });
  });

  // ── createOrder ────────────────────────────────────────────────────────────
  describe('createOrder', () => {
    beforeEach(() => {
      productRepo.findByIds.mockResolvedValue([buildProduct()]);
      orderRepo.create.mockResolvedValue(buildOrder());
    });

    it('should create an order with computed items and totals', async () => {
      await createOrder({
        customer:    buildCustomer(),
        items:       [buildCartItem()],
        paymentMode: 'Credit',
      });

      expect(orderRepo.create).toHaveBeenCalledTimes(1);
      const [orderData] = orderRepo.create.mock.calls[0];
      expect(orderData.customer).toEqual(expect.objectContaining({ name: 'Jane Doe' }));
      expect(orderData.items).toHaveLength(1);
      expect(orderData.subtotal).toBe(1000); // 500 × 2
      expect(orderData.total).toBe(1000);
    });

    it('should default paymentMode to "Credit" when not provided', async () => {
      await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      const [orderData] = orderRepo.create.mock.calls[0];
      expect(orderData.paymentMode).toBe('Credit');
    });

    it('should generate a PDF buffer and upload it to ImageKit as the invoice', async () => {
      await createOrder({
        customer:    buildCustomer(),
        items:       [buildCartItem()],
        paymentMode: 'UPI',
      });

      expect(imagekitService.uploadInvoicePdf).toHaveBeenCalledWith(
        expect.any(Buffer),
        'ADI-0001',
      );
    });

    it('should return the CDN invoice URL as pdfUrl', async () => {
      const result = await createOrder({
        customer:    buildCustomer(),
        items:       [buildCartItem()],
        paymentMode: 'UPI',
      });

      expect(result.pdfUrl).toBe(INVOICE_CDN_URL);
    });

    it('should persist the invoiceUrl and invoiceFileId on the order after upload', async () => {
      await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      expect(orderRepo.update).toHaveBeenCalledWith(
        'order-id-001',
        expect.objectContaining({
          invoiceUrl:    INVOICE_CDN_URL,
          invoiceFileId: 'invoice-fid-001',
        }),
      );
    });

    it('should return the created order and autoSent status', async () => {
      const result = await createOrder({
        customer:    buildCustomer(),
        items:       [buildCartItem()],
        paymentMode: 'UPI',
      });

      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('pdfUrl');
      expect(result).toHaveProperty('autoSent');
    });

    it('should throw 404 ApiError when a cart item references a non-existent product', async () => {
      productRepo.findByIds.mockResolvedValue([]);

      await expect(
        createOrder({
          customer: buildCustomer(),
          items:    [buildCartItem({ productId: 'nonexistent' })],
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

      const result = await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      expect(waService.sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(result.autoSent.waReady).toBe(false);
    });

    it('should send WhatsApp messages to admin and customer when WA is ready', async () => {
      const { findOneAdmin } = await import('../../../src/repositories/admin.repository.js');
      findOneAdmin.mockResolvedValue({ whatsappNumber: '919999999999' });
      waService.getWAStatus.mockReturnValue({ isReady: true });

      await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      expect(waService.sendWhatsAppMessage).toHaveBeenCalledTimes(2);
    });

    it('should send the PDF buffer as a WhatsApp document when WA is ready', async () => {
      const { findOneAdmin } = await import('../../../src/repositories/admin.repository.js');
      findOneAdmin.mockResolvedValue({ whatsappNumber: '919999999999' });
      waService.getWAStatus.mockReturnValue({ isReady: true });

      await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      expect(waService.sendWhatsAppDocumentBuffer).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        'Invoice-ADI-0001.pdf',
        expect.stringContaining('ADI-0001'),
      );
    });

    it('should set gstTotal to 0', async () => {
      await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      const [orderData] = orderRepo.create.mock.calls[0];
      expect(orderData.gstTotal).toBe(0);
    });

    it('should continue without throwing when PDF upload fails (non-fatal)', async () => {
      imagekitService.uploadInvoicePdf.mockRejectedValue(new Error('CDN down'));

      const result = await createOrder({ customer: buildCustomer(), items: [buildCartItem()] });

      expect(result).toHaveProperty('order');
      expect(result.pdfUrl).toBeNull();
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
        message:    'Order not found',
      });
    });
  });

  // ── getOrderInvoice ────────────────────────────────────────────────────────
  describe('getOrderInvoice', () => {
    it('should return the cached CDN invoiceUrl when it already exists on the order', async () => {
      const order = buildOrder({ invoiceUrl: INVOICE_CDN_URL });
      orderRepo.findById.mockResolvedValue(order);

      const result = await getOrderInvoice('order-id-001');

      expect(result.invoiceUrl).toBe(INVOICE_CDN_URL);
      expect(imagekitService.uploadInvoicePdf).not.toHaveBeenCalled();
    });

    it('should generate and upload the invoice when order has no invoiceUrl', async () => {
      const order = buildOrder({ invoiceUrl: null });
      orderRepo.findById.mockResolvedValue(order);

      const result = await getOrderInvoice('order-id-001');

      expect(imagekitService.uploadInvoicePdf).toHaveBeenCalledWith(
        expect.any(Buffer),
        'ADI-0001',
      );
      expect(result.invoiceUrl).toBe(INVOICE_CDN_URL);
    });

    it('should persist the invoiceUrl and invoiceFileId on the order after on-demand generation', async () => {
      const order = buildOrder({ invoiceUrl: null });
      orderRepo.findById.mockResolvedValue(order);

      await getOrderInvoice('order-id-001');

      expect(orderRepo.update).toHaveBeenCalledWith(
        'order-id-001',
        expect.objectContaining({
          invoiceUrl:    INVOICE_CDN_URL,
          invoiceFileId: 'invoice-fid-001',
        }),
      );
    });

    it('should return the order document alongside the invoiceUrl', async () => {
      const order = buildOrder({ invoiceUrl: INVOICE_CDN_URL });
      orderRepo.findById.mockResolvedValue(order);

      const result = await getOrderInvoice('order-id-001');

      expect(result).toHaveProperty('order');
      expect(result.order).toEqual(order);
    });

    it('should throw 404 ApiError when order is not found', async () => {
      orderRepo.findById.mockResolvedValue(null);

      await expect(getOrderInvoice('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message:    'Order not found',
      });
    });
  });
});
