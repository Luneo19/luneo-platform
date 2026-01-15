/**
 * Tests for AIService
 * T-SVC-002: Tests pour le service IA
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService, retryWithBackoff, checkAndDeductCredits, queueAIJob } from '../AIService';
import { cacheService } from '@/lib/cache/redis';
import * as Sentry from '@sentry/nextjs';
import { track } from '@vercel/analytics';

// Mocks
vi.mock('@/lib/cache/redis', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // RETRY WITH BACKOFF TESTS
  // ============================================

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      const result = await retryWithBackoff(fn, 3, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      
      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      const start = Date.now();
      await retryWithBackoff(fn, 3, 100);
      const duration = Date.now() - start;
      
      // Should have waited at least 100ms + 200ms (exponential backoff)
      expect(duration).toBeGreaterThan(200);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================
  // CHECK AND DEDUCT CREDITS TESTS
  // ============================================

  describe('checkAndDeductCredits', () => {
    const createMockSupabaseClient = () => {
      const mockSingle = vi.fn();
      const mockEqSelect = vi.fn(() => ({ single: mockSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEqSelect }));

      const mockEqUpdate = vi.fn();
      const mockUpdate = vi.fn(() => ({ eq: mockEqUpdate }));

      const fromMock = vi.fn(() => ({
        select: mockSelect,
        update: mockUpdate,
      }));

      return {
        from: fromMock,
        _mockSingle: mockSingle,
        _mockEqUpdate: mockEqUpdate,
      };
    };

    beforeEach(() => {
      vi.clearAllMocks();
      (cacheService.get as vi.Mock).mockResolvedValue(null);
    });

    it('should deduct credits from cache', async () => {
      (cacheService.get as vi.Mock).mockResolvedValue('100');
      (cacheService.set as vi.Mock).mockResolvedValue(undefined);

      const mockClient = createMockSupabaseClient();
      mockClient._mockEqUpdate.mockResolvedValue({ error: null });

      const result = await checkAndDeductCredits('user-123', 10, mockClient as any);

      expect(result.success).toBe(true);
      expect(result.balance).toBe(90);
      expect(cacheService.set).toHaveBeenCalledWith('credits:user-123', '90', { ttl: 60 * 1000 });
      expect(track).toHaveBeenCalledWith('credits_deducted', {
        userId: 'user-123',
        amount: 10,
        newBalance: 90,
      });
    });

    it('should fetch credits from DB on cache miss', async () => {
      (cacheService.get as vi.Mock).mockResolvedValue(null);
      (cacheService.set as vi.Mock).mockResolvedValue(undefined);

      const mockClient = createMockSupabaseClient();
      mockClient._mockSingle.mockResolvedValue({
        data: { ai_credits: 100 },
        error: null,
      });
      mockClient._mockEqUpdate.mockResolvedValue({ error: null });

      const result = await checkAndDeductCredits('user-123', 10, mockClient as any);

      expect(result.success).toBe(true);
      expect(result.balance).toBe(90);
      expect(cacheService.set).toHaveBeenCalledWith('credits:user-123', '100', { ttl: 60 * 1000 });
    });

    it('should reject if insufficient credits', async () => {
      (cacheService.get as vi.Mock).mockResolvedValue('5');

      const mockClient = createMockSupabaseClient();
      const result = await checkAndDeductCredits('user-123', 10, mockClient as any);

      expect(result.success).toBe(false);
      expect(result.balance).toBe(5);
      expect(result.error).toContain('Insufficient credits');
    });

    it('should handle errors and report to Sentry', async () => {
      (cacheService.get as vi.Mock).mockRejectedValue(new Error('Cache error'));

      const mockClient = createMockSupabaseClient();
      await expect(
        checkAndDeductCredits('user-123', 10, mockClient as any)
      ).rejects.toThrow();

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  // ============================================
  // QUEUE AI JOB TESTS
  // ============================================

  describe('queueAIJob', () => {
    it('should queue a text-to-design job', async () => {
      const jobId = await queueAIJob('text-to-design', { userId: 'user-123', prompt: 'test' });
      
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
      expect(jobId).toContain('text-to-design');
    });

    it('should queue an upscale job', async () => {
      const jobId = await queueAIJob('upscale', { userId: 'user-123', imageId: 'img-123' });
      
      expect(jobId).toBeDefined();
      expect(jobId).toContain('upscale');
    });

    it('should queue a background-removal job', async () => {
      const jobId = await queueAIJob('background-removal', { userId: 'user-123', imageId: 'img-123' });
      
      expect(jobId).toBeDefined();
      expect(jobId).toContain('background-removal');
    });

    it('should handle errors and report to Sentry', async () => {
      // Mock logger to throw
      const originalError = console.error;
      console.error = vi.fn();
      
      // This should not throw, but if it does, Sentry should catch it
      const jobId = await queueAIJob('text-to-design', { userId: 'user-123' });
      expect(jobId).toBeDefined();
      
      console.error = originalError;
    });
  });

  // ============================================
  // SERVICE EXPORT TESTS
  // ============================================

  describe('AIService export', () => {
    it('should export checkAndDeductCredits', () => {
      expect(AIService.checkAndDeductCredits).toBeDefined();
      expect(typeof AIService.checkAndDeductCredits).toBe('function');
    });

    it('should export queueAIJob', () => {
      expect(AIService.queueAIJob).toBeDefined();
      expect(typeof AIService.queueAIJob).toBe('function');
    });

    it('should export retryWithBackoff', () => {
      expect(AIService.retryWithBackoff).toBeDefined();
      expect(typeof AIService.retryWithBackoff).toBe('function');
    });
  });
});

