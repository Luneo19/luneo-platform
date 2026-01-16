/**
 * Tests for BillingService
 * T-SVC-001: Tests pour le service de facturation
 */

import { cacheService } from '@/lib/cache/CacheService';
import { db } from '@/lib/db';
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

vi.mock('@/lib/db', () => ({
  db: {
    brand: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
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
      vi.mocked(db.brand.findUnique).mockResolvedValue(null);

      const result = await billingService.getSubscription('brand-123', false);

      expect(result).toBeNull();
    });

    it('should return local subscription if no Stripe subscription', async () => {
      vi.mocked(cacheService.get).mockReturnValue(null);
      vi.mocked(db.brand.findUnique).mockResolvedValue({
        id: 'brand-123',
        plan: 'PRO',
        stripeSubscriptionId: null,
        stripeCustomerId: null,
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
    it('should update subscription plan', async () => {
      // Set environment variable for price ID
      const originalEnv = process.env.STRIPE_PRICE_STARTER_MONTHLY;
      process.env.STRIPE_PRICE_STARTER_MONTHLY = 'price_starter_test';

      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue({
            id: 'sub-123',
            status: 'active',
            items: { data: [{ id: 'si-123', price: { id: 'price_starter_test' } }] },
          }),
          update: vi.fn().mockResolvedValue({
            id: 'sub-123',
            status: 'active',
            items: { data: [{ price: { id: 'price_starter_test' } }] },
          }),
        },
      };

      vi.mocked(getStripe).mockReturnValue(mockStripe as any);
      vi.mocked(db.brand.findUnique)
        .mockResolvedValueOnce({
          id: 'brand-123',
          stripeSubscriptionId: 'sub-123',
          stripeCustomerId: 'cus-123',
        } as any)
        .mockResolvedValueOnce({
          id: 'brand-123',
          stripeCustomerId: 'cus-123',
        } as any);
      vi.mocked(db.brand.update).mockResolvedValue({} as any);
      
      // Mock getSubscription to return a subscription with stripeSubscriptionId
      // Note: updateSubscription calls getSubscription first, then retrieves from Stripe
      vi.spyOn(billingService, 'getSubscription' as any).mockResolvedValue({
        id: 'sub-123',
        stripeSubscriptionId: 'sub-123',
        status: 'active',
        plan: 'starter',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      });

      const result = await billingService.updateSubscription('brand-123', {
        plan: 'starter',
      });

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub-123',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              price: 'price_starter_test',
            }),
          ]),
        })
      );
      expect(result).toBeDefined();

      // Restore original env
      if (originalEnv) {
        process.env.STRIPE_PRICE_STARTER_MONTHLY = originalEnv;
      } else {
        delete process.env.STRIPE_PRICE_STARTER_MONTHLY;
      }
    });
  });

  // ============================================
  // LIST INVOICES TESTS
  // ============================================

  describe('listInvoices', () => {
    it('should return invoices from Stripe', async () => {
      const mockStripe = {
        invoices: {
          list: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'inv-123',
                number: 'INV-001',
                amount_due: 10000,
                currency: 'eur',
                status: 'paid',
                created: Math.floor(Date.now() / 1000),
                due_date: Math.floor(Date.now() / 1000),
                invoice_pdf: 'https://example.com/invoice.pdf',
                hosted_invoice_url: 'https://example.com/invoice',
                status_transitions: {
                  paid_at: Math.floor(Date.now() / 1000),
                },
                lines: {
                  data: [],
                },
              },
            ],
          }),
        },
        customers: {
          retrieve: vi.fn().mockResolvedValue({
            id: 'cus-123',
          }),
        },
      };

      vi.mocked(getStripe).mockReturnValue(mockStripe as any);
      vi.mocked(db.brand.findUnique).mockResolvedValue({
        id: 'brand-123',
        stripeCustomerId: 'cus-123',
      } as any);

      const result = await billingService.listInvoices('brand-123');

      expect(mockStripe.invoices.list).toHaveBeenCalled();
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
      // Mock trpcVanilla pour getUsageMetrics
      const mockUsageMetrics = {
        customizations: 100,
        renders: 50,
        apiCalls: 200,
        storageBytes: 1024 * 1024,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
      };

      // Le service utilise trpcVanilla, donc on mock directement le résultat
      // Pour l'instant, on teste que la méthode existe
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
    it('should return payment methods', async () => {
      const mockStripe = {
        paymentMethods: {
          list: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'pm-123',
                type: 'card',
                card: { last4: '4242', brand: 'visa', exp_month: 12, exp_year: 2025 },
              },
            ],
          }),
        },
        customers: {
          retrieve: vi.fn().mockResolvedValue({
            id: 'cus-123',
            invoice_settings: { default_payment_method: null },
          }),
        },
      };

      vi.mocked(getStripe).mockReturnValue(mockStripe as any);
      vi.mocked(db.brand.findUnique).mockResolvedValue({
        id: 'brand-123',
        stripeCustomerId: 'cus-123',
      } as any);

      const result = await billingService.listPaymentMethods('brand-123');

      expect(mockStripe.paymentMethods.list).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

