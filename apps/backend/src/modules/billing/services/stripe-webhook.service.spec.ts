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
import { ReferralService } from '@/modules/referral/referral.service';
import type Stripe from 'stripe';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;

  const mockPrisma: Record<string, any> = {
    processedWebhookEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    brand: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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
    invoice: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((args: unknown): Promise<unknown> => {
      if (Array.isArray(args)) return Promise.all(args);
      return (args as (prisma: Record<string, any>) => Promise<unknown>)(mockPrisma);
    }),
  };

  const mockCreditsService = {
    addCredits: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockStripeClientService = {
    getStripe: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  const mockReferralService = {
    createCommissionFromOrder: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default: no event processed yet
    mockPrisma.processedWebhookEvent.findUnique.mockResolvedValue(null);
    mockPrisma.processedWebhookEvent.upsert.mockResolvedValue({});
    mockPrisma.processedWebhookEvent.update.mockResolvedValue({});
    // Restore $transaction mock (reset by resetMocks: true in jest config)
    mockPrisma.$transaction.mockImplementation((args: unknown): Promise<unknown> => {
      if (Array.isArray(args)) return Promise.all(args);
      return (args as (prisma: Record<string, any>) => Promise<unknown>)(mockPrisma);
    });
    // Restore email service mock
    mockEmailService.sendEmail.mockResolvedValue(undefined);
    mockEmailService.sendOrderConfirmationEmail.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CreditsService, useValue: mockCreditsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: StripeClientService, useValue: mockStripeClientService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ReferralService, useValue: mockReferralService },
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
      // Service uses upsert for atomic idempotency check
      mockPrisma.processedWebhookEvent.upsert.mockResolvedValue({
        eventId: event.id,
        processed: true,
        attempts: 1,
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

      const mockOrder = {
        id: 'order-1',
        status: 'PENDING',
        orderNumber: 'ORD-001',
        paymentStatus: 'PENDING',
        totalCents: 2999,
        currency: 'EUR',
        customerEmail: 'test@test.com',
        customerName: 'Test User',
        userId: 'user-1',
        subtotalCents: 2499,
        items: [],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.order.findFirst.mockResolvedValue(null);
      // Ensure $transaction calls the callback with mockPrisma
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(mockPrisma));
      // Prevent sendOrderConfirmationSafe from throwing (fire-and-forget email)
      jest.spyOn(service as any, 'sendOrderConfirmationSafe').mockImplementation(() => {});
      jest.spyOn(service as any, 'createReferralCommissionSafe').mockImplementation(() => {});

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

    it('should route invoice.payment_failed and set gracePeriodEndsAt + PAST_DUE', async () => {
      const invoice = {
        id: 'in_test',
        customer: 'cus_test',
        amount_due: 2900,
        currency: 'eur',
        attempt_count: 1,
        next_payment_attempt: null,
      };
      const event = makeEvent('invoice.payment_failed', invoice);
      const beforeCall = Date.now();

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
      const updateCall = mockPrisma.brand.update.mock.calls[0][0];
      expect(updateCall.data.subscriptionStatus).toBe('PAST_DUE');
      expect(updateCall.data.gracePeriodEndsAt).toBeDefined();
      const graceEnd = updateCall.data.gracePeriodEndsAt as Date;
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      expect(graceEnd.getTime()).toBeGreaterThanOrEqual(beforeCall + threeDaysMs - 5000);
      expect(graceEnd.getTime()).toBeLessThanOrEqual(beforeCall + threeDaysMs + 5000);
    });

    it('should route invoice.payment_succeeded and clear grace period + readOnlyMode', async () => {
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
          where: { id: 'brand-1' },
          data: {
            subscriptionStatus: 'ACTIVE',
            gracePeriodEndsAt: null,
            readOnlyMode: false,
            lastGraceReminderDay: null,
          },
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
  // New webhook handlers (Phase 2)
  // ──────────────────────────────────────────────────────────────

  describe('new webhook handlers', () => {
    it('should route invoice.created and upsert invoice record', async () => {
      const invoice = {
        id: 'in_created_test',
        customer: 'cus_test',
        amount_due: 4900,
        currency: 'eur',
        status: 'draft',
        period_start: Math.floor(Date.now() / 1000) - 86400 * 30,
        period_end: Math.floor(Date.now() / 1000),
        invoice_pdf: 'https://stripe.com/invoice.pdf',
      };
      const event = makeEvent('invoice.created', invoice);

      mockPrisma.brand.findFirst.mockResolvedValue({ id: 'brand-1', stripeCustomerId: 'cus_test' });
      mockPrisma.invoice.upsert.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(expect.objectContaining({ type: 'invoice_created', brandId: 'brand-1' }));
      expect(mockPrisma.invoice.upsert).toHaveBeenCalled();
    });

    it('should route payment_intent.succeeded and update order', async () => {
      const pi = { id: 'pi_test', metadata: { orderId: 'order-1' }, customer: 'cus_test' };
      const event = makeEvent('payment_intent.succeeded', pi);

      mockPrisma.order.update.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(expect.objectContaining({ type: 'payment_intent_succeeded' }));
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({ paymentStatus: 'SUCCEEDED' }),
        }),
      );
    });

    it('should route payment_intent.payment_failed', async () => {
      const pi = { id: 'pi_fail', metadata: { orderId: 'order-2' }, customer: 'cus_test', last_payment_error: { message: 'card declined' } };
      const event = makeEvent('payment_intent.payment_failed', pi);

      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.brand.findFirst.mockResolvedValue({ id: 'brand-1', name: 'Test Brand' });

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(expect.objectContaining({ type: 'payment_intent_failed' }));
    });

    it('should route customer.deleted and clear stripe refs', async () => {
      const customer = { id: 'cus_deleted' };
      const event = makeEvent('customer.deleted', customer);

      mockPrisma.brand.findFirst.mockResolvedValue({ id: 'brand-1', name: 'Test Brand', stripeCustomerId: 'cus_deleted' });
      mockPrisma.brand.update.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);
      mockPrisma.notification.create.mockResolvedValue({});

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(expect.objectContaining({ type: 'customer_deleted', brandId: 'brand-1' }));
      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subscriptionStatus: 'CANCELED', stripeSubscriptionId: null }),
        }),
      );
    });

    it('should route setup_intent.succeeded', async () => {
      const si = { id: 'seti_test', customer: 'cus_test', payment_method: 'pm_test' };
      const event = makeEvent('setup_intent.succeeded', si);

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual(expect.objectContaining({ type: 'setup_intent_succeeded' }));
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

      await expect(service.handleStripeWebhook(event)).rejects.toThrow();

      expect(mockPrisma.processedWebhookEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: event.id },
          data: expect.objectContaining({ error: expect.any(String) }),
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
