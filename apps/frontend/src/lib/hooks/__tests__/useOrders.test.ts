/**
 * Tests for useOrders hooks
 * T-HOOK-002: Tests pour les hooks de commandes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrders, useOrder, useCreateOrder, useUpdateOrder } from '../useOrders';
import { logger } from '@/lib/logger';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useOrders - List Orders', () => {
    it('should load orders with default pagination', async () => {
      const mockOrders = [
        { id: 'order-1', orderNumber: 'ORD-001', status: 'PENDING' },
        { id: 'order-2', orderNumber: 'ORD-002', status: 'SHIPPED' },
      ];

      const mockPagination = {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orders: mockOrders,
            pagination: mockPagination,
          },
        }),
      });

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toEqual(mockOrders);
      expect(result.current.pagination).toEqual(mockPagination);
      expect(result.current.error).toBeNull();
    });

    it('should load orders with custom params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            orders: [],
            pagination: { page: 2, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: true },
          },
        }),
      });

      const { result } = renderHook(() => useOrders({ page: 2, limit: 10, status: 'PENDING' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('status=PENDING'));
    });

    it('should handle error loading orders', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to load orders',
        }),
      });

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load orders');
      expect(result.current.orders).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should refresh orders', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              orders: [{ id: 'order-1' }],
              pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
            },
          }),
        });

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1);
      });
    });
  });

  describe('useOrder - Single Order', () => {
    it('should load single order by id', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        status: 'PENDING',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { order: mockOrder },
        }),
      });

      const { result } = renderHook(() => useOrder('order-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.order).toEqual(mockOrder);
      expect(result.current.error).toBeNull();
    });

    it('should not load if id is empty', async () => {
      const { result } = renderHook(() => useOrder(''));

      // Should not make any fetch calls
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.order).toBeNull();
    });

    it('should handle error loading order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Order not found',
        }),
      });

      const { result } = renderHook(() => useOrder('order-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Order not found');
      expect(result.current.order).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('useCreateOrder', () => {
    it('should create order successfully', async () => {
      const mockOrderData = {
        items: [{ productId: 'prod-1', quantity: 1 }],
        shipping_address: { street: '123 Main St', city: 'Paris' },
      };

      const mockCreatedOrder = {
        id: 'order-new',
        orderNumber: 'ORD-002',
        status: 'PENDING',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { order: mockCreatedOrder },
        }),
      });

      const { result } = renderHook(() => useCreateOrder());

      const createdOrder = await result.current.createOrder(mockOrderData);

      expect(createdOrder).toEqual(mockCreatedOrder);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle error creating order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to create order',
        }),
      });

      const { result } = renderHook(() => useCreateOrder());

      await expect(
        result.current.createOrder({
          items: [],
          shipping_address: {},
        })
      ).rejects.toThrow('Failed to create order');

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to create order');
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('useUpdateOrder', () => {
    it('should update order successfully', async () => {
      const mockUpdatedOrder = {
        id: 'order-123',
        status: 'SHIPPED',
        tracking_number: 'TRACK123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { order: mockUpdatedOrder },
        }),
      });

      const { result } = renderHook(() => useUpdateOrder());

      const updatedOrder = await result.current.updateOrder('order-123', {
        status: 'SHIPPED',
        tracking_number: 'TRACK123',
      });

      expect(updatedOrder).toEqual(mockUpdatedOrder);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should cancel order successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Order cancelled' },
        }),
      });

      const { result } = renderHook(() => useUpdateOrder());

      const cancelResult = await result.current.cancelOrder('order-123');

      expect(cancelResult.success).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it('should handle error updating order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Failed to update',
        }),
      });

      const { result } = renderHook(() => useUpdateOrder());

      await expect(
        result.current.updateOrder('order-123', { status: 'SHIPPED' })
      ).rejects.toThrow('Failed to update');

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to update');
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

