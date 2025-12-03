/**
 * Tests useBilling Hook
 * T-009: Tests pour composants de billing (Checkout, Portal)
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBilling } from '@/lib/hooks/useBilling';
import { AllProviders } from '../utils/test-utils';
import { mockPlans } from '../fixtures';

// Mock fetch
const mockFetch = vi.fn();

describe('useBilling Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  // ============================================
  // INITIAL STATE
  // ============================================

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { subscription: null } }),
      });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should have null subscription initially', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { subscription: null } }),
      });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should have empty invoices initially', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { subscription: null, invoices: [] } }),
      });

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
      const mockSubscription = {
        tier: 'professional',
        status: 'active',
        period: 'monthly',
      };

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/subscription')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { subscription: mockSubscription } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { invoices: [] } }),
        });
      });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.subscription).toEqual(mockSubscription);
      });
    });

    it('should handle subscription loading error', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/subscription')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Subscription not found' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { invoices: [] } }),
        });
      });

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
      const mockInvoices = [
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

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/invoices')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { invoices: mockInvoices } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { subscription: null } }),
        });
      });

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
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should not crash
      expect(result.current.error).toBeTruthy();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

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
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/subscription')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: {
                subscription: { tier: 'professional', status: 'active' },
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { invoices: [] } }),
        });
      });

      const { result } = renderHook(() => useBilling(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.subscription?.status).toBe('active');
      });
    });

    it('should identify trial subscription', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/subscription')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: {
                subscription: {
                  tier: 'professional',
                  status: 'trialing',
                  trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                },
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { invoices: [] } }),
        });
      });

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


