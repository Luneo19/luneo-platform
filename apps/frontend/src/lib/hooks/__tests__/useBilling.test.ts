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

// Mock API client (hook uses endpoints.billing, not fetch)
const mockSubscriptionFn = vi.fn();
const mockInvoicesFn = vi.fn();
vi.mock('@/lib/api/client', () => ({
  endpoints: {
    billing: {
      subscription: () => mockSubscriptionFn(),
      invoices: () => mockInvoicesFn(),
    },
  },
}));

describe('useBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      mockSubscriptionFn.mockResolvedValue({ data: { subscription: null } });
      mockInvoicesFn.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling());

      expect(result.current.loading).toBe(true);
      expect(result.current.subscription).toBeNull();
      expect(result.current.invoices).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should load subscription and invoices on mount', async () => {
      const sub = { tier: 'pro', status: 'active', period: 'monthly' };
      const invs = [
        { id: 'inv-1', number: 'INV-001', amount: 100, currency: 'eur', status: 'paid', paid: true, created: '2024-01-01', description: 'Subscription' },
      ];
      mockSubscriptionFn.mockResolvedValue({ data: { subscription: sub } });
      mockInvoicesFn.mockResolvedValue({ data: { invoices: invs } });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscription).toEqual(sub);
      expect(result.current.invoices).toEqual(invs);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription loading error', async () => {
      mockSubscriptionFn.mockRejectedValue(new Error('Failed to load subscription'));
      mockInvoicesFn.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load subscription');
      expect(result.current.subscription).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle invoices loading error gracefully', async () => {
      mockSubscriptionFn.mockResolvedValue({ data: { subscription: null } });
      mockInvoicesFn.mockRejectedValue(new Error('Failed to load invoices'));

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.invoices).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockSubscriptionFn.mockRejectedValue(new Error('Network error'));
      mockInvoicesFn.mockResolvedValue({ data: { invoices: [] } });

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
      const sub = { tier: 'pro', status: 'active' };
      mockSubscriptionFn
        .mockResolvedValueOnce({ data: { subscription: null } })
        .mockResolvedValueOnce({ data: { subscription: sub } });
      mockInvoicesFn.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.subscription).toEqual(sub);
      });

      expect(mockSubscriptionFn).toHaveBeenCalledTimes(2);
      expect(mockInvoicesFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memoization', () => {
    it('should memoize subscription and invoices', async () => {
      const sub = { tier: 'pro', status: 'active' };
      const invs = [{ id: 'inv-1', number: 'INV-001', amount: 100, currency: 'eur', status: 'paid', paid: true, created: '2024-01-01', description: 'Test' }];
      mockSubscriptionFn.mockResolvedValue({ data: { subscription: sub } });
      mockInvoicesFn.mockResolvedValue({ data: { invoices: invs } });

      const { result, rerender } = renderHook(() => useBilling());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstSubscription = result.current.subscription;
      const firstInvoices = result.current.invoices;

      rerender();

      expect(result.current.subscription).toBe(firstSubscription);
      expect(result.current.invoices).toBe(firstInvoices);
    });
  });
});













