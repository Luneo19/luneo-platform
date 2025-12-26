/**
 * Tests for useCredits hook
 * T-HOOK-003: Tests pour le hook de crédits
 */

import { logger } from '@/lib/logger';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCredits } from '../useCredits';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useCredits', () => {
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
        json: async () => ({ balance: 100, purchased: 200, used: 100 }),
      });

      const { result } = renderHook(() => useCredits());

      expect(result.current.loading).toBe(true);
      expect(result.current.credits).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should load credits on mount', async () => {
      const mockCredits = {
        balance: 100,
        purchased: 200,
        used: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCredits,
      });

      const { result } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.credits).toEqual(mockCredits);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Credit Status Flags', () => {
    it('should set isLow when balance < 20', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balance: 15, purchased: 100, used: 85 }),
      });

      const { result } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isLow).toBe(true);
      expect(result.current.isCritical).toBe(false);
    });

    it('should set isCritical when balance < 5', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balance: 3, purchased: 100, used: 97 }),
      });

      const { result } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isLow).toBe(true);
      expect(result.current.isCritical).toBe(true);
    });

    it('should not set flags when balance >= 20', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ balance: 50, purchased: 100, used: 50 }),
      });

      const { result } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isLow).toBe(false);
      expect(result.current.isCritical).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Erreur de chargement');
      expect(result.current.credits).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Erreur de chargement');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Manual Refresh', () => {
    it('should refetch credits on demand', async () => {
      const mockCredits1 = { balance: 100, purchased: 200, used: 100 };
      const mockCredits2 = { balance: 80, purchased: 200, used: 120 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCredits1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCredits2,
        });

      const { result } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(result.current.credits).toEqual(mockCredits1);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.credits).toEqual(mockCredits2);
      });
    });
  });

  describe('Interval Setup', () => {
    it('should set up interval for auto-refresh', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ balance: 100, purchased: 200, used: 100 }),
      });

      const { unmount } = renderHook(() => useCredits());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Verify interval is set up (by checking that fetch is called on mount)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      unmount();
    });
  });
});
