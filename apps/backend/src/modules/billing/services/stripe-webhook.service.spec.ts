/**
 * StripeWebhookService Unit Tests
 * Tests webhook event routing, idempotency, and handler delegation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeClientService } from './stripe-client.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreditsService } from '@/libs/credits/credits.service';
import { EmailService } from '@/modules/email/email.service';
import type Stripe from 'stripe';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;

  const mockPrisma = {
    processedWebhookEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    brand: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    commission: {
      update: jest.fn(),
    },
    artisan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    creditPack: {
      findFirst: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  const mockCreditsService = {
    addCredits: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockStripeClientService = {
    getStripe: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: no event processed yet
    mockPrisma.processedWebhookEvent.findUnique.mockResolvedValue(null);
    mockPrisma.processedWebhookEvent.upsert.mockResolvedValue({});
    mockPrisma.processedWebhookEvent.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CreditsService, useValue: mockCreditsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: StripeClientService, useValue: mockStripeClientService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
  });

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────

  function makeEvent(type: string, data: Record<string, any> = {}): Stripe.Event {
    return {
      id: `evt_test_${Date.now()}`,
      type,
      data: { object: data },
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 0,
      request: null,
    } as unknown as Stripe.Event;
  }

  // ──────────────────────────────────────────────────────────────
  // Idempotency
  // ──────────────────────────────────────────────────────────────

  describe('idempotency', () => {
    it('should skip already-processed events', async () => {
      const event = makeEvent('checkout.session.completed', { id: 'cs_test', mode: 'payment' });
      mockPrisma.processedWebhookEvent.findUnique.mockResolvedValue({
        eventId: event.id,
        processed: true,
        result: { type: 'already_done' },
      });

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual({ type: 'already_done' });
      // Should not have attempted to process further
      expect(mockPrisma.brand.findFirst).not.toHaveBeenCalled();
    });

    it('should upsert event record before processing', async () => {
      const event = makeEvent('customer.updated', { id: 'cus_test' });
      mockPrisma.brand.findFirst.mockResolvedValue(null);

      await service.handleStripeWebhook(event);

      expect(mockPrisma.processedWebhookEvent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: event.id },
          create: expect.objectContaining({
            eventId: event.id,
            eventType: event.type,
            processed: false,
            attempts: 1,
          }),
          update: { attempts: { increment: 1 } },
        }),
      );
    });

    it('should mark event as processed after successful handling', async () => {
      const event = makeEvent('customer.updated', { id: 'cus_test' });
      mockPrisma.brand.findFirst.mockResolvedValue({ id: 'brand-1' });

      await service.handleStripeWebhook(event);

      expect(mockPrisma.processedWebhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: event.id },
          data: expect.objectContaining({ processed: true }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Event routing
  // ──────────────────────────────────────────────────────────────

  describe('event routing', () => {
    it('should route checkout.session.completed to handleCheckoutSessionCompleted', async () => {
      const session = {
        id: 'cs_test',
        mode: 'payment',
        metadata: { orderId: 'order-1' },
        payment_intent: 'pi_test',
      };
      const event = makeEvent('checkout.session.completed', session);

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        orderNumber: 'ORD-001',
        paymentStatus: 'PENDING',
      });
      mockPrisma.order.update.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(
        expect.objectContaining({ type: 'order_payment', orderId: 'order-1' }),
      );
    });

    it('should route customer.subscription.updated to handleSubscriptionUpdated', async () => {
      const subscription = {
        id: 'sub_test',
        customer: 'cus_test',
        status: 'active',
        items: { data: [] },
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        trial_end: null,
        metadata: {},
      };
      const event = makeEvent('customer.subscription.updated', subscription);

      mockPrisma.brand.findFirst.mockResolvedValue({
        id: 'brand-1',
        stripeCustomerId: 'cus_test',
        subscriptionStatus: 'ACTIVE',
        plan: 'starter',
        limits: {},
        users: [],
      });
      mockPrisma.brand.update.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(
        expect.objectContaining({ type: 'subscription_updated', brandId: 'brand-1' }),
      );
    });

    it('should route customer.subscription.deleted to handleSubscriptionDeleted', async () => {
      const subscription = {
        id: 'sub_test',
        customer: 'cus_test',
        status: 'canceled',
      };
      const event = makeEvent('customer.subscription.deleted', subscription);

      mockPrisma.brand.findFirst.mockResolvedValue({
        id: 'brand-1',
        stripeCustomerId: 'cus_test',
        limits: {},
        users: [],
      });
      mockPrisma.brand.update.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(
        expect.objectContaining({ type: 'subscription_deleted', brandId: 'brand-1' }),
      );
    });

    it('should route invoice.payment_failed to handleInvoicePaymentFailed', async () => {
      const invoice = {
        id: 'in_test',
        customer: 'cus_test',
        amount_due: 2900,
        currency: 'eur',
        attempt_count: 1,
        next_payment_attempt: null,
      };
      const event = makeEvent('invoice.payment_failed', invoice);

      mockPrisma.brand.findFirst.mockResolvedValue({
        id: 'brand-1',
        stripeCustomerId: 'cus_test',
        users: [{ email: 'user@test.com', role: 'BRAND_ADMIN', firstName: 'Test' }],
      });
      mockPrisma.brand.update.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(
        expect.objectContaining({ type: 'invoice_payment_failed', invoiceId: 'in_test' }),
      );
      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { subscriptionStatus: 'PAST_DUE' },
        }),
      );
    });

    it('should route invoice.payment_succeeded to handleInvoicePaymentSucceeded', async () => {
      const invoice = { id: 'in_test', customer: 'cus_test' };
      const event = makeEvent('invoice.payment_succeeded', invoice);

      mockPrisma.brand.findFirst.mockResolvedValue({
        id: 'brand-1',
        subscriptionStatus: 'PAST_DUE',
      });
      mockPrisma.brand.update.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { subscriptionStatus: 'ACTIVE' },
        }),
      );
    });

    it('should handle unrecognised event types gracefully', async () => {
      const event = makeEvent('some.unknown.event', { id: 'foo' });

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // mapStripeStatusToAppStatus
  // ──────────────────────────────────────────────────────────────

  describe('mapStripeStatusToAppStatus', () => {
    it.each([
      ['trialing', 'TRIALING'],
      ['active', 'ACTIVE'],
      ['past_due', 'PAST_DUE'],
      ['unpaid', 'PAST_DUE'],
      ['canceled', 'CANCELED'],
      ['incomplete_expired', 'CANCELED'],
      ['incomplete', 'PAST_DUE'],
      ['paused', 'PAST_DUE'],
    ] as [Stripe.Subscription.Status, string][])('should map "%s" to "%s"', (stripeStatus, expected) => {
      expect(service.mapStripeStatusToAppStatus(stripeStatus)).toBe(expected);
    });

    it('should default to ACTIVE for unknown statuses', () => {
      expect(service.mapStripeStatusToAppStatus('unknown_status' as any)).toBe('ACTIVE');
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Error handling
  // ──────────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('should record error on webhook event and re-throw', async () => {
      const event = makeEvent('customer.subscription.updated', {
        id: 'sub_test',
        customer: 'cus_test',
        status: 'active',
        items: { data: [] },
        metadata: {},
      });

      mockPrisma.brand.findFirst.mockRejectedValue(new Error('DB failure'));

      await expect(service.handleStripeWebhook(event)).rejects.toThrow('DB failure');

      expect(mockPrisma.processedWebhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: event.id },
          data: { error: 'DB failure' },
        }),
      );
    });

    it('should continue gracefully if idempotency check itself fails', async () => {
      const event = makeEvent('customer.updated', { id: 'cus_test' });

      // Idempotency table not available
      mockPrisma.processedWebhookEvent.findUnique.mockRejectedValue(new Error('table missing'));
      mockPrisma.brand.findFirst.mockResolvedValue(null);

      // Should still process the event
      const result = await service.handleStripeWebhook(event);
      expect(result.processed).toBe(true);
    });
  });
});
