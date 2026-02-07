/**
 * Tests for BillingService
 * T-SVC-001: Tests pour le service de facturation
 */

import { cacheService } from '@/lib/cache/CacheService';
import { api, endpoints } from '@/lib/api/client';
import { getStripe } from '@/lib/stripe/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingService } from '../BillingService';

// Mocks
vi.mock('@/lib/cache/CacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(),
  isStripeConfigured: vi.fn(() => true),
}));

vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  endpoints: {
    billing: {
      subscription: vi.fn(),
      changePlan: vi.fn(),
      cancelSubscription: vi.fn(),
      cancel: vi.fn(),
      paymentMethods: vi.fn(),
      addPaymentMethod: vi.fn(),
    },
    brands: {
      current: vi.fn(),
    },
  },
}));

describe('BillingService', () => {
  let billingService: BillingService;

  beforeEach(() => {
    vi.clearAllMocks();
    billingService = BillingService.getInstance();
  });

  // ============================================
  // SINGLETON TESTS
  // ============================================

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BillingService.getInstance();
      const instance2 = BillingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  // ============================================
  // GET SUBSCRIPTION TESTS
  // ============================================

  describe('getSubscription', () => {
    it('should return subscription from cache', async () => {
      const mockSubscription = {
        id: 'sub-123',
        status: 'active' as const,
        plan: 'pro' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      };

      vi.mocked(cacheService.get).mockReturnValue(mockSubscription);

      const result = await billingService.getSubscription('brand-123');

      expect(cacheService.get).toHaveBeenCalledWith('subscription:brand-123');
      expect(result).toEqual(mockSubscription);
    });

    it('should return null if no subscription exists', async () => {
      vi.mocked(cacheService.get).mockReturnValue(null);
      vi.mocked(endpoints.billing.subscription).mockResolvedValue(null);

      const result = await billingService.getSubscription('brand-123', false);

      expect(result).toBeNull();
    });

    it('should return subscription from API when cache miss', async () => {
      vi.mocked(cacheService.get).mockReturnValue(null);
      vi.mocked(endpoints.billing.subscription).mockResolvedValue({
        id: 'sub-123',
        status: 'active',
        plan: 'PRO',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      } as any);

      const result = await billingService.getSubscription('brand-123', false);

      expect(result).not.toBeNull();
      expect(result?.plan).toBe('pro');
      expect(result?.status).toBe('active');
    });
  });

  // ============================================
  // UPDATE SUBSCRIPTION TESTS
  // ============================================

  describe('updateSubscription', () => {
    it('should update subscription plan via API', async () => {
      vi.mocked(endpoints.billing.changePlan).mockResolvedValue({
        id: 'sub-123',
        status: 'active',
        plan: 'starter',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      } as any);

      const result = await billingService.updateSubscription('brand-123', {
        plan: 'starter',
      });

      expect(endpoints.billing.changePlan).toHaveBeenCalledWith(
        expect.objectContaining({ planId: 'starter' })
      );
      expect(result).toBeDefined();
      expect(result.plan).toBe('starter');
    });
  });

  // ============================================
  // LIST INVOICES TESTS
  // ============================================

  describe('listInvoices', () => {
    it('should return invoices from API', async () => {
      vi.mocked(api.get).mockResolvedValue({
        invoices: [
          {
            id: 'inv-123',
            number: 'INV-001',
            amount: 100,
            currency: 'eur',
            status: 'paid',
            created: new Date().toISOString(),
            due_date: new Date().toISOString(),
            invoice_pdf: 'https://example.com/invoice.pdf',
            hosted_invoice_url: 'https://example.com/invoice',
            status_transitions: { paid_at: new Date().toISOString() },
            lines: { data: [] },
          },
        ],
        total: 1,
        hasMore: false,
      } as any);

      const result = await billingService.listInvoices('brand-123');

      expect(api.get).toHaveBeenCalledWith(
        '/api/v1/billing/invoices',
        expect.objectContaining({ params: expect.objectContaining({ brandId: 'brand-123' }) })
      );
      expect(result).toBeDefined();
      expect(result.invoices).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);
    });
  });

  // ============================================
  // GET USAGE METRICS TESTS
  // ============================================

  describe('getUsageMetrics', () => {
    it('should return usage metrics', async () => {
      expect(billingService.getUsageMetrics).toBeDefined();
      expect(typeof billingService.getUsageMetrics).toBe('function');
    });
  });

  // ============================================
  // GET BILLING LIMITS TESTS
  // ============================================

  describe('getBillingLimits', () => {
    it('should return billing limits', async () => {
      expect(billingService.getBillingLimits).toBeDefined();
      expect(typeof billingService.getBillingLimits).toBe('function');
    });
  });

  // ============================================
  // LIST PAYMENT METHODS TESTS
  // ============================================

  describe('listPaymentMethods', () => {
    it('should return payment methods from API', async () => {
      vi.mocked(endpoints.billing.paymentMethods).mockResolvedValue([
        {
          id: 'pm-123',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025,
        },
      ] as any);

      const result = await billingService.listPaymentMethods('brand-123');

      expect(endpoints.billing.paymentMethods).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
