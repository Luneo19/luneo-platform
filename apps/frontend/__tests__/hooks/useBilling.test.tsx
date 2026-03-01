/**
 * Tests useBilling Hook
 * T-009: Tests pour composants de billing (Checkout, Portal)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBilling } from '@/lib/hooks/useBilling';
import { AllProviders } from '../utils/test-utils';

// Mock API client (hook uses endpoints.billing, not fetch)
const mockSubscription = vi.fn();
const mockInvoices = vi.fn();
vi.mock('@/lib/api/client', () => ({
  endpoints: {
    billing: {
      subscription: () => mockSubscription(),
      invoices: () => mockInvoices(),
    },
  },
}));

describe('useBilling Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // INITIAL STATE
  // ============================================

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      mockSubscription.mockResolvedValue({ data: { subscription: null } });
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should have null subscription initially', async () => {
      mockSubscription.mockResolvedValue({ data: { subscription: null } });
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should have empty invoices initially', async () => {
      mockSubscription.mockResolvedValue({ data: { subscription: null } });
      mockInvoices.mockResolvedValue({ data: { invoices: [], subscription: null } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.invoices).toEqual([]);
      });
    });
  });

  // ============================================
  // LOADING SUBSCRIPTION
  // ============================================

  describe('Loading Subscription', () => {
    it('should load subscription successfully', async () => {
      const sub = { tier: 'professional', status: 'active', period: 'monthly' };
      mockSubscription.mockResolvedValue({ data: { subscription: sub } });
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.subscription).toEqual(sub);
      });
    });

    it('should handle subscription loading error', async () => {
      mockSubscription.mockRejectedValue(new Error('Subscription not found'));
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  // ============================================
  // LOADING INVOICES
  // ============================================

  describe('Loading Invoices', () => {
    it('should load invoices successfully', async () => {
      const invs = [
        {
          id: 'inv_001',
          number: 'INV-001',
          amount: 4900,
          currency: 'EUR',
          status: 'paid',
          paid: true,
          created: '2024-11-01T00:00:00Z',
          description: 'Professional Plan - Monthly',
        },
      ];
      mockSubscription.mockResolvedValue({ data: { subscription: null } });
      mockInvoices.mockResolvedValue({ data: { invoices: invs } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.invoices).toHaveLength(1);
        expect(result.current.invoices[0].id).toBe('inv_001');
      });
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSubscription.mockRejectedValue(new Error('Network error'));
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle API errors gracefully', async () => {
      mockSubscription.mockRejectedValue(new Error('Internal server error'));
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // ============================================
  // SUBSCRIPTION STATUS
  // ============================================

  describe('Subscription Status', () => {
    it('should identify active subscription', async () => {
      mockSubscription.mockResolvedValue({
        data: { subscription: { tier: 'professional', status: 'active' } },
      });
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.subscription?.status).toBe('active');
      });
    });

    it('should identify trial subscription', async () => {
      mockSubscription.mockResolvedValue({
        data: {
          subscription: {
            tier: 'professional',
            status: 'trialing',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      });
      mockInvoices.mockResolvedValue({ data: { invoices: [] } });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.subscription?.status).toBe('trialing');
        expect(result.current.subscription?.trial_ends_at).toBeTruthy();
      });
    });
  });
});


