/**
 * Tests for useBilling hook
 * T-HOOK-001: Tests pour le hook de facturation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBilling } from '../useBilling';
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

describe('useBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { subscription: null } }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { invoices: [] } }),
      });

      const { result } = renderHook(() => useBilling());

      expect(result.current.loading).toBe(true);
      expect(result.current.subscription).toBeNull();
      expect(result.current.invoices).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should load subscription and invoices on mount', async () => {
      const mockSubscription = {
        tier: 'pro',
        status: 'active',
        period: 'monthly',
      };

      const mockInvoices = [
        {
          id: 'inv-1',
          number: 'INV-001',
          amount: 100,
          currency: 'eur',
          status: 'paid',
          paid: true,
          created: '2024-01-01',
          description: 'Subscription',
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { subscription: mockSubscription } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { invoices: mockInvoices } }),
        });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription).toEqual(mockSubscription);
      expect(result.current.invoices).toEqual(mockInvoices);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription loading error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to load subscription' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { invoices: [] } }),
        });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load subscription');
      expect(result.current.subscription).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle invoices loading error gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { subscription: null } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to load invoices' }),
        });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Invoices error doesn't set the error state, just logs
      expect(result.current.invoices).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { invoices: [] } }),
        });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Refresh', () => {
    it('should refresh subscription and invoices', async () => {
      const mockSubscription = {
        tier: 'starter',
        status: 'active',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { subscription: null } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { invoices: [] } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { subscription: mockSubscription } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { invoices: [] } }),
        });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.subscription).toEqual(mockSubscription);
      });

      expect(mockFetch).toHaveBeenCalledTimes(4); // 2 initial + 2 refresh
    });
  });

  describe('Memoization', () => {
    it('should memoize subscription and invoices', async () => {
      const mockSubscription = { tier: 'pro', status: 'active' };
      const mockInvoices = [{ id: 'inv-1', number: 'INV-001', amount: 100, currency: 'eur', status: 'paid', paid: true, created: '2024-01-01', description: 'Test' }];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { subscription: mockSubscription } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { invoices: mockInvoices } }),
        });

      const { result, rerender } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstSubscription = result.current.subscription;
      const firstInvoices = result.current.invoices;

      rerender();

      // Should be the same reference due to memoization
      expect(result.current.subscription).toBe(firstSubscription);
      expect(result.current.invoices).toBe(firstInvoices);
    });
  });
});










