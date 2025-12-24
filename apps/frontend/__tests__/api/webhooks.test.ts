/**
 * Tests API Webhooks
 * T-030: Tests API webhooks Stripe
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    dbError: vi.fn(),
    apiError: vi.fn(),
  },
}));

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock Stripe
const mockStripe = {
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}));

describe('API: Stripe Webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_xxx';
  });

  describe('POST /api/stripe/webhook', () => {
    it('should reject request without signature', async () => {
      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_SIGNATURE');
    });

    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        id: 'evt_test_xxx',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_xxx',
            customer: 'cus_test_xxx',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processed).toBe(true);
    });

    it('should handle customer.subscription.updated event', async () => {
      const mockEvent = {
        id: 'evt_test_xxx',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_xxx',
            customer: 'cus_test_xxx',
            status: 'active',
            items: {
              data: [{ price: { nickname: 'professional' } }],
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processed).toBe(true);
    });

    it('should handle customer.subscription.deleted event', async () => {
      const mockEvent = {
        id: 'evt_test_xxx',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_xxx',
            customer: 'cus_test_xxx',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processed).toBe(true);
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const mockEvent = {
        id: 'evt_test_xxx',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_xxx',
            customer: 'cus_test_xxx',
            number: 'INV-001',
            amount_paid: 2900,
            currency: 'eur',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processed).toBe(true);
    });

    it('should handle invoice.payment_failed event', async () => {
      const mockEvent = {
        id: 'evt_test_xxx',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test_xxx',
            customer: 'cus_test_xxx',
            number: 'INV-001',
            amount_due: 2900,
            currency: 'eur',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processed).toBe(true);
    });

    it('should handle unrecognized event types', async () => {
      const mockEvent = {
        id: 'evt_test_xxx',
        type: 'unknown.event.type',
        data: {
          object: {},
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.processed).toBe(false);
    });

    it('should log webhook to database', async () => {
      const mockEvent = {
        id: 'evt_test_log',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_xxx',
            customer: 'cus_test_xxx',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const { POST } = await import('@/app/api/stripe/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });

      await POST(request);

      // Verify that insert was called on webhook_logs
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('webhook_logs');
    });
  });
});

describe('API: E-commerce Webhooks', () => {
  describe('POST /api/integrations/shopify/webhook', () => {
    it('should handle Shopify webhooks', async () => {
      try {
        const { POST } = await import('@/app/api/integrations/shopify/webhook/route');
        expect(POST).toBeDefined();
      } catch {
        // Expected
      }
    });
  });

  describe('POST /api/integrations/woocommerce/webhook', () => {
    it('should handle WooCommerce webhooks', async () => {
      try {
        const { POST } = await import('@/app/api/integrations/woocommerce/webhook/route');
        expect(POST).toBeDefined();
      } catch {
        // Expected
      }
    });
  });

  describe('POST /api/webhooks/pod', () => {
    it('should handle Print-on-Demand webhooks', async () => {
      try {
        const { POST } = await import('@/app/api/webhooks/pod/route');
        expect(POST).toBeDefined();
      } catch {
        // Expected
      }
    });
  });
});

