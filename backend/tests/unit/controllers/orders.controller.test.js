/**
 * Unit tests for: OrdersController
 * Module path:    src/controllers/orders.controller.js
 * Created:        2026-03-22
 * Updated:        2026-03-24 — CDN ImageKit migration (getOrderInvoice returns invoiceUrl JSON)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/orders.service.js', () => ({
  createOrder:     vi.fn(),
  getOrderById:    vi.fn(),
  getOrderInvoice: vi.fn(),
}));

import * as ordersService from '../../../src/services/orders.service.js';
import {
  createOrder,
  getOrderById,
  getOrderInvoice,
} from '../../../src/controllers/orders.controller.js';
import { ApiError } from '../../../src/utils/api-error.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const mockReq = (overrides = {}) => ({ body: {}, params: {}, ...overrides });

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

// asyncHandler does not return the inner Promise; flush microtasks before asserting.
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

const INVOICE_CDN_URL = 'https://ik.imagekit.io/test/adiyogi/invoices/invoice-ADI-0001.pdf';

describe('orders.controller', () => {
  let res, next;

  beforeEach(() => {
    res  = mockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  // ── createOrder ────────────────────────────────────────────────────────────
  describe('createOrder', () => {
    it('should return 201 with the created order result', async () => {
      const serviceResult = {
        order:    { orderId: 'ADI-0001' },
        pdfUrl:   INVOICE_CDN_URL,
        autoSent: { admin: true, customer: true, waReady: true },
      };
      ordersService.createOrder.mockResolvedValue(serviceResult);

      createOrder(mockReq({ body: { customer: {}, items: [], paymentMode: 'Credit' } }), res, next);
      await flushPromises();

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(serviceResult);
    });

    it('should pass req.body directly to the service', async () => {
      const body = { customer: { name: 'Jane' }, items: [{ productId: 'p1', quantity: 1 }] };
      ordersService.createOrder.mockResolvedValue({});

      createOrder(mockReq({ body }), res, next);
      await flushPromises();

      expect(ordersService.createOrder).toHaveBeenCalledWith(body);
    });

    it('should call next with error when service throws', async () => {
      ordersService.createOrder.mockRejectedValue(new ApiError(404, 'Product not found'));

      createOrder(mockReq(), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── getOrderById ───────────────────────────────────────────────────────────
  describe('getOrderById', () => {
    it('should return the order as JSON', async () => {
      const order = { orderId: 'ADI-0001', status: 'Pending' };
      ordersService.getOrderById.mockResolvedValue(order);

      getOrderById(mockReq({ params: { id: 'ADI-0001' } }), res, next);
      await flushPromises();

      expect(ordersService.getOrderById).toHaveBeenCalledWith('ADI-0001');
      expect(res.json).toHaveBeenCalledWith(order);
    });

    it('should call next with 404 ApiError when order is not found', async () => {
      ordersService.getOrderById.mockRejectedValue(new ApiError(404, 'Order not found'));

      getOrderById(mockReq({ params: { id: 'bad-id' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ── getOrderInvoice ────────────────────────────────────────────────────────
  describe('getOrderInvoice', () => {
    it('should return the CDN invoiceUrl as JSON', async () => {
      ordersService.getOrderInvoice.mockResolvedValue({
        order:      { orderId: 'ADI-0001' },
        invoiceUrl: INVOICE_CDN_URL,
      });

      getOrderInvoice(mockReq({ params: { id: 'order-id-001' } }), res, next);
      await flushPromises();

      expect(res.json).toHaveBeenCalledWith({ invoiceUrl: INVOICE_CDN_URL });
    });

    it('should call the service with the correct order id from params', async () => {
      ordersService.getOrderInvoice.mockResolvedValue({
        order:      { orderId: 'ADI-0001' },
        invoiceUrl: INVOICE_CDN_URL,
      });

      getOrderInvoice(mockReq({ params: { id: 'order-id-001' } }), res, next);
      await flushPromises();

      expect(ordersService.getOrderInvoice).toHaveBeenCalledWith('order-id-001');
    });

    it('should call next with 404 ApiError when order does not exist', async () => {
      ordersService.getOrderInvoice.mockRejectedValue(new ApiError(404, 'Order not found'));

      getOrderInvoice(mockReq({ params: { id: 'bad-id' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('should call next with 503 ApiError when PDF generation is unavailable', async () => {
      ordersService.getOrderInvoice.mockRejectedValue(
        new ApiError(503, 'PDF generation is unavailable'),
      );

      getOrderInvoice(mockReq({ params: { id: 'order-id-001' } }), res, next);
      await flushPromises();

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 503 }));
    });
  });
});
