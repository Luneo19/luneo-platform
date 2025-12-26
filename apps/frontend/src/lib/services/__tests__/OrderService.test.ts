/**
 * Tests for OrderService
 * T-SVC-003: Tests pour le service de commandes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../OrderService';
import { trpcVanilla } from '@/lib/trpc/vanilla-client';
import { cacheService } from '@/lib/cache/CacheService';
import type { Order, OrderItem } from '@/lib/types/order';

// Mocks
vi.mock('@/lib/trpc/vanilla-client', () => ({
  trpcVanilla: {
    order: {
      create: {
        mutate: vi.fn(),
      },
      getById: {
        query: vi.fn(),
      },
      list: {
        query: vi.fn(),
      },
      update: {
        mutate: vi.fn(),
      },
      generateProductionFiles: {
        mutate: vi.fn(),
      },
      checkProductionStatus: {
        query: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/cache/CacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    invalidateCache: vi.fn(),
  },
}));

// Mock fetch for POD API
global.fetch = vi.fn();

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = OrderService.getInstance();
  });

  // ============================================
  // SINGLETON TESTS
  // ============================================

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = OrderService.getInstance();
      const instance2 = OrderService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // ============================================
  // CREATE ORDER TESTS
  // ============================================

  describe('create', () => {
    it('should create an order', async () => {
      const mockOrderData = {
        id: 'order-123',
        userId: 'user-123',
        brandId: 'brand-123',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingStatus: 'PENDING',
        items: [],
        subtotalCents: 10000,
        shippingCents: 500,
        taxCents: 1000,
        totalCents: 11500,
        currency: 'EUR',
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR',
        },
        notes: null,
        internalNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        paymentMethodId: null,
        trackingNumber: null,
        shippingProvider: null,
      };

      (trpcVanilla.order.create.mutate as vi.Mock).mockResolvedValue(mockOrderData);

      const request = {
        items: [
          {
            id: 'item-1',
            productId: 'product-123',
            productName: 'Test Product',
            quantity: 1,
            price: 100,
            totalPrice: 100,
          } as OrderItem,
        ],
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'FR',
        },
      };

      const result = await orderService.create(request);

      expect(result).toBeDefined();
      expect(result.id).toBe('order-123');
      expect(trpcVanilla.order.create.mutate).toHaveBeenCalled();
      expect(cacheService.invalidateCache).toHaveBeenCalled();
    });

    it('should handle errors when creating order', async () => {
      (trpcVanilla.order.create.mutate as vi.Mock).mockRejectedValue(new Error('Failed'));

      await expect(
        orderService.create({
          items: [],
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main St',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
          },
        })
      ).rejects.toThrow();
    });
  });

  // ============================================
  // GET BY ID TESTS
  // ============================================

  describe('getById', () => {
    it('should return order from cache if available', async () => {
      const mockOrder: Order = {
        id: 'order-123',
        userId: 'user-123',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        items: [],
        subtotal: 100,
        shippingCost: 5,
        tax: 10,
        discount: 0,
        totalAmount: 115,
        currency: 'EUR',
        shippingAddress: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (cacheService.get as vi.Mock).mockReturnValue(mockOrder);

      const result = await orderService.getById('order-123', true);

      expect(result).toEqual(mockOrder);
      expect(cacheService.get).toHaveBeenCalledWith('order:order-123');
      expect(trpcVanilla.order.getById.query).not.toHaveBeenCalled();
    });

    it('should fetch order from API if cache miss', async () => {
      (cacheService.get as vi.Mock).mockReturnValue(null);
      (cacheService.set as vi.Mock).mockResolvedValue(undefined);

      const mockOrderData = {
        id: 'order-123',
        userId: 'user-123',
        orderNumber: 'ORD-001',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingStatus: 'PENDING',
        items: [],
        subtotalCents: 10000,
        shippingCents: 500,
        taxCents: 1000,
        totalCents: 11500,
        currency: 'EUR',
        shippingAddress: {} as any,
        notes: null,
        internalNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        paymentMethodId: null,
        trackingNumber: null,
        shippingProvider: null,
      };

      (cacheService.get as vi.Mock).mockReturnValue(null);
      (trpcVanilla.order.getById.query as vi.Mock).mockResolvedValue(mockOrderData);

      const result = await orderService.getById('order-123', true);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.id).toBe('order-123');
      expect(trpcVanilla.order.getById.query).toHaveBeenCalledWith({ id: 'order-123' });
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  // ============================================
  // LIST ORDERS TESTS
  // ============================================

  describe('list', () => {
    it('should list orders', async () => {
      const mockResult = {
        orders: [
          {
            id: 'order-123',
            userId: 'user-123',
            orderNumber: 'ORD-001',
            status: 'PENDING',
            items: [],
            subtotalCents: 10000,
            shippingCents: 500,
            taxCents: 1000,
            totalCents: 11500,
            currency: 'EUR',
            shippingAddress: {} as any,
            notes: null,
            internalNotes: null,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            confirmedAt: null,
            shippedAt: null,
            deliveredAt: null,
            cancelledAt: null,
            paymentMethodId: null,
            trackingNumber: null,
            shippingProvider: null,
          },
        ],
        total: 1,
        hasMore: false,
      };

      (trpcVanilla.order.list.query as vi.Mock).mockResolvedValue(mockResult);

      const result = await orderService.list();

      expect(result).toBeDefined();
      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(trpcVanilla.order.list.query).toHaveBeenCalled();
    });

    it('should list orders with filters', async () => {
      const mockResult = {
        orders: [],
        total: 0,
        hasMore: false,
      };

      (trpcVanilla.order.list.query as vi.Mock).mockResolvedValue(mockResult);

      const result = await orderService.list({
        status: 'PENDING',
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(trpcVanilla.order.list.query).toHaveBeenCalledWith({
        status: 'PENDING',
        limit: 10,
        offset: 0,
      });
    });
  });

  // ============================================
  // UPDATE ORDER TESTS
  // ============================================

  describe('update', () => {
    it('should update an order', async () => {
      const mockOrderData = {
        id: 'order-123',
        userId: 'user-123',
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        shippingStatus: 'PENDING',
        items: [],
        subtotalCents: 10000,
        shippingCents: 500,
        taxCents: 1000,
        totalCents: 11500,
        currency: 'EUR',
        shippingAddress: {} as any,
        notes: null,
        internalNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: new Date(),
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        paymentMethodId: null,
        trackingNumber: null,
        shippingProvider: null,
      };

      (trpcVanilla.order.update.mutate as vi.Mock).mockResolvedValue(mockOrderData);

      const result = await orderService.update('order-123', {
        status: 'CONFIRMED',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('CONFIRMED');
      expect(trpcVanilla.order.update.mutate).toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalledWith('order:order-123');
    });
  });

  // ============================================
  // CANCEL ORDER TESTS
  // ============================================

  describe('cancel', () => {
    it('should cancel an order', async () => {
      const mockOrderData = {
        id: 'order-123',
        userId: 'user-123',
        orderNumber: 'ORD-001',
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        shippingStatus: 'CANCELLED',
        items: [],
        subtotalCents: 10000,
        shippingCents: 500,
        taxCents: 1000,
        totalCents: 11500,
        currency: 'EUR',
        shippingAddress: {} as any,
        notes: 'Annulée: Customer request',
        internalNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: new Date(),
        paymentMethodId: null,
        trackingNumber: null,
        shippingProvider: null,
      };

      (trpcVanilla.order.update.mutate as vi.Mock).mockResolvedValue(mockOrderData);

      const result = await orderService.cancel('order-123', 'Customer request');

      expect(result).toBeDefined();
      expect(result.status).toBe('CANCELLED');
      expect(trpcVanilla.order.update.mutate).toHaveBeenCalledWith({
        id: 'order-123',
        status: 'CANCELLED',
        notes: 'Annulée: Customer request',
        trackingNumber: undefined,
        shippingProvider: undefined,
        metadata: undefined,
      });
    });
  });

  // ============================================
  // PRODUCTION FILES TESTS
  // ============================================

  describe('generateProductionFiles', () => {
    it('should generate production files', async () => {
      const mockResult = {
        jobId: 'job-123',
        status: 'PENDING' as const,
        files: [],
      };

      (trpcVanilla.order.generateProductionFiles.mutate as vi.Mock).mockResolvedValue(mockResult);

      const result = await orderService.generateProductionFiles('order-123', {
        formats: ['pdf', 'png'],
        quality: 'print-ready',
      });

      expect(result).toBeDefined();
      expect(result.jobId).toBe('job-123');
      expect(trpcVanilla.order.generateProductionFiles.mutate).toHaveBeenCalled();
    });
  });

  describe('checkProductionStatus', () => {
    it('should check production status', async () => {
      const mockResult = {
        status: 'PROCESSING' as const,
        progress: 50,
        files: [],
      };

      (trpcVanilla.order.checkProductionStatus.query as vi.Mock).mockResolvedValue(mockResult);

      const result = await orderService.checkProductionStatus('job-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('PROCESSING');
      expect(result.progress).toBe(50);
    });
  });

  // ============================================
  // TRACKING TESTS
  // ============================================

  describe('updateTracking', () => {
    it('should update tracking', async () => {
      const mockOrderData = {
        id: 'order-123',
        userId: 'user-123',
        orderNumber: 'ORD-001',
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        shippingStatus: 'SHIPPED',
        items: [],
        subtotalCents: 10000,
        shippingCents: 500,
        taxCents: 1000,
        totalCents: 11500,
        currency: 'EUR',
        shippingAddress: {} as any,
        notes: null,
        internalNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: new Date(),
        shippedAt: new Date(),
        deliveredAt: null,
        cancelledAt: null,
        paymentMethodId: null,
        trackingNumber: 'TRACK-123',
        shippingProvider: 'DHL',
      };

      (trpcVanilla.order.update.mutate as vi.Mock).mockResolvedValue(mockOrderData);

      const result = await orderService.updateTracking('order-123', 'TRACK-123', 'DHL');

      expect(result).toBeDefined();
      expect(result.status).toBe('SHIPPED');
      expect(trpcVanilla.order.update.mutate).toHaveBeenCalledWith({
        id: 'order-123',
        status: 'SHIPPED',
        trackingNumber: 'TRACK-123',
        shippingProvider: 'DHL',
        notes: undefined,
        metadata: undefined,
      });
    });
  });

  describe('markAsDelivered', () => {
    it('should mark order as delivered', async () => {
      const mockOrderData = {
        id: 'order-123',
        userId: 'user-123',
        orderNumber: 'ORD-001',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        shippingStatus: 'DELIVERED',
        items: [],
        subtotalCents: 10000,
        shippingCents: 500,
        taxCents: 1000,
        totalCents: 11500,
        currency: 'EUR',
        shippingAddress: {} as any,
        notes: null,
        internalNotes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedAt: new Date(),
        shippedAt: new Date(),
        deliveredAt: new Date(),
        cancelledAt: null,
        paymentMethodId: null,
        trackingNumber: 'TRACK-123',
        shippingProvider: 'DHL',
      };

      (trpcVanilla.order.update.mutate as vi.Mock).mockResolvedValue(mockOrderData);

      const result = await orderService.markAsDelivered('order-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('DELIVERED');
    });
  });

  // ============================================
  // POD INTEGRATION TESTS
  // ============================================

  describe('sendToPOD', () => {
    it('should send order to POD', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            podOrderId: 'pod-123',
            status: 'pending',
            trackingUrl: 'https://tracking.example.com',
          },
        }),
      });

      const result = await orderService.sendToPOD('order-123', 'printful', {
        autoFulfill: true,
        notifyCustomer: true,
      });

      expect(result).toBeDefined();
      expect(result.podOrderId).toBe('pod-123');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/pod/printful/submit',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should handle POD API errors', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid order' }),
      });

      await expect(
        orderService.sendToPOD('order-123', 'printful')
      ).rejects.toThrow();
    });
  });
});

