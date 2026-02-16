/**
 * BillingService Tests
 * Unit tests for billing service with mocked StripeClientService, StripeWebhookService, AuditLogsService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StripeClientService } from './services/stripe-client.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { AuditLogsService } from '@/modules/security/services/audit-logs.service';
import { DistributedLockService } from '@/libs/redis/distributed-lock.service';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;
  let stripeClient: jest.Mocked<StripeClientService>;
  let webhookService: jest.Mocked<StripeWebhookService>;

  const mockCheckoutSessionsCreate = jest.fn();
  const mockStripe = {
    checkout: {
      sessions: { create: mockCheckoutSessionsCreate },
    },
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    invoices: {
      list: jest.fn(),
    },
    billingPortal: {
      sessions: { create: jest.fn() },
    },
  };

  const configValues: Record<string, string | number> = {
    'app.nodeEnv': 'test',
    'app.frontendUrl': 'http://localhost:3000',
    'stripe.secretKey': 'sk_test_xxx',
    'stripe.webhookSecret': 'whsec_xxx',
    'stripe.successUrl': 'https://test.com/success',
    'stripe.cancelUrl': 'https://test.com/cancel',
    'stripe.trialPeriodDays': 14,
    'stripe.priceStarterMonthly': 'price_starter_monthly',
    'stripe.priceStarterYearly': 'price_starter_yearly',
    'stripe.priceProMonthly': 'price_pro_monthly',
    'stripe.priceProYearly': 'price_pro_yearly',
    'stripe.priceProfessionalMonthly': 'price_professional_monthly',
    'stripe.priceProfessionalYearly': 'price_professional_yearly',
    'stripe.priceBusinessMonthly': 'price_business_monthly',
    'stripe.priceBusinessYearly': 'price_business_yearly',
    'stripe.priceEnterpriseMonthly': 'price_enterprise_monthly',
    'stripe.priceEnterpriseYearly': 'price_enterprise_yearly',
  };

  const mockPrisma: any = {
    user: { findUnique: jest.fn(), count: jest.fn() },
    brand: { findUnique: jest.fn(), update: jest.fn() },
    design: { count: jest.fn() },
    usageRecord: { aggregate: jest.fn() },
    assetFile: { aggregate: jest.fn() },
    aIQuota: { findFirst: jest.fn() },
  };
  mockPrisma.$transaction = jest.fn((fn: (tx: any) => Promise<any>) => fn(mockPrisma));

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCheckoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    });
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      current_period_end: 1706745600,
    });
    mockStripe.subscriptions.update.mockResolvedValue({
      id: 'sub_123',
      cancel_at_period_end: true,
      current_period_end: 1706745600,
    });
    mockStripe.subscriptions.cancel.mockResolvedValue({ id: 'sub_123', status: 'canceled' });
    mockStripe.invoices.list.mockResolvedValue({
      data: [],
      has_more: false,
    });
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/session/xxx',
    });

    const mockStripeClient = {
      getStripe: jest.fn().mockResolvedValue(mockStripe),
      executeWithResilience: jest.fn((op: () => Promise<unknown>) => op()),
      getCircuitStatus: jest.fn().mockReturnValue({ state: 'closed', failures: 0 }),
      validatedPriceIds: null,
      stripeConfigValid: true,
    };

    const mockWebhookService = {
      handleStripeWebhook: jest.fn().mockResolvedValue({ processed: true, result: {} }),
    };

    const mockAuditLogsService = {
      logSuccess: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => configValues[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: StripeClientService, useValue: mockStripeClient },
        { provide: StripeWebhookService, useValue: mockWebhookService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
        {
          provide: DistributedLockService,
          useValue: { acquire: jest.fn().mockResolvedValue(true), release: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService);
    stripeClient = module.get(StripeClientService);
    webhookService = module.get(StripeWebhookService);
  });

  describe('createCheckoutSession', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create Stripe checkout session with valid params', async () => {
      const result = await service.createCheckoutSession('starter', 'user-123', 'test@test.com');

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://checkout.stripe.com/test');
      expect(result.sessionId).toBe('cs_test_123');
      expect(stripeClient.executeWithResilience).toHaveBeenCalled();
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer_email: 'test@test.com',
          metadata: expect.objectContaining({ userId: 'user-123', planId: 'starter' }),
        }),
      );
    });

    it('should throw BadRequestException if planId is empty', async () => {
      await expect(
        service.createCheckoutSession('', 'user-123', 'test@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if userId is empty', async () => {
      await expect(
        service.createCheckoutSession('starter', '', 'test@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email is invalid', async () => {
      await expect(
        service.createCheckoutSession('starter', 'user-123', 'invalid-email'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for unknown/non-self-service plan', async () => {
      await expect(
        service.createCheckoutSession('nonexistent_plan', 'user-123', 'test@test.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubscription', () => {
    it('should return default free plan if user has no brand', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brandId: null,
        brand: null,
      } as any);

      const result = await service.getSubscription('user-123');

      expect(result.plan).toBe('free');
      expect(result.status).toBe('active');
      expect(result.limits).toBeDefined();
      expect(result.currentUsage).toBeDefined();
    });

    it('should return subscription from brand and Stripe when brand has subscription', async () => {
      const brand = {
        id: 'brand-123',
        plan: 'professional',
        subscriptionPlan: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        monthlyGenerations: 10,
        planExpiresAt: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brandId: 'brand-123',
        brand,
      } as any);
      mockPrisma.design.count.mockResolvedValue(5);
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.usageRecord.aggregate
        .mockResolvedValueOnce({ _sum: { count: 10 } })
        .mockResolvedValueOnce({ _sum: { count: 20 } });
      mockPrisma.assetFile.aggregate.mockResolvedValue({ _sum: { sizeBytes: 0 } });
      mockPrisma.aIQuota.findFirst.mockResolvedValue(null);

      const result = await service.getSubscription('user-123');

      expect(result.plan).toBe('professional');
      expect(result.status).toBe('active');
      expect(result.currentUsage.designs).toBe(5);
      expect(result.currentUsage.teamMembers).toBe(2);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel at period end by default', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: {
          id: 'brand-123',
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
        },
      } as any);

      const result = await service.cancelSubscription('user-123');

      expect(result.success).toBe(true);
      expect(result.cancelAt).toBeDefined();
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      });
    });

    it('should cancel immediately when immediate=true and update brand', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: {
          id: 'brand-123',
          stripeSubscriptionId: 'sub_123',
        },
      } as any);
      mockPrisma.brand.update.mockResolvedValue({} as any);

      const result = await service.cancelSubscription('user-123', true);

      expect(result.success).toBe(true);
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123');
      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'brand-123' },
          data: expect.objectContaining({
            subscriptionStatus: 'CANCELED',
            plan: 'free',
          }),
        }),
      );
    });

    it('should throw BadRequestException if no active subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: { id: 'brand-123', stripeSubscriptionId: null },
      } as any);

      await expect(service.cancelSubscription('user-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleStripeWebhook', () => {
    it('should process checkout.session.completed via webhook service', async () => {
      const event = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123' } },
      } as any;
      webhookService.handleStripeWebhook.mockResolvedValue({
        processed: true,
        result: { sessionId: 'cs_123' },
      });

      const result = await service.handleStripeWebhook(event);

      expect(result.processed).toBe(true);
      expect(result.result).toEqual({ sessionId: 'cs_123' });
      expect(webhookService.handleStripeWebhook).toHaveBeenCalledWith(event);
    });
  });

  describe('getInvoices', () => {
    it('should return empty list when user has no stripe customer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: null,
      } as any);

      const result = await service.getInvoices('user-123');

      expect(result.invoices).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should return invoices from Stripe when user has customer id', async () => {
      const invoicesData = [
        {
          id: 'in_1',
          number: 'INV-001',
          amount_paid: 2900,
          amount_due: 2900,
          currency: 'eur',
          status: 'paid',
          created: 1704067200,
          due_date: 1704067200,
          status_transitions: { paid_at: 1704067200 },
          invoice_pdf: 'https://pdf',
          hosted_invoice_url: 'https://invoice',
          lines: { data: [{ description: 'Plan', amount: 2900, quantity: 1 }] },
        },
      ];
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: { stripeCustomerId: 'cus_123' },
      } as any);
      mockStripe.invoices.list.mockResolvedValue({
        data: invoicesData as any,
        has_more: false,
      });

      const result = await service.getInvoices('user-123', 1, 20);

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].id).toBe('in_1');
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('createCustomerPortalSession', () => {
    it('should create portal session when user has stripe customer id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: { stripeCustomerId: 'cus_123' },
      } as any);

      const result = await service.createCustomerPortalSession('user-123');

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://billing.stripe.com/session/xxx');
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          return_url: expect.any(String),
        }),
      );
    });

    it('should throw when no stripe customer id (service catch rewraps as InternalServerErrorException)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: { stripeCustomerId: null },
      } as any);

      await expect(service.createCustomerPortalSession('user-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw on Stripe error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: { stripeCustomerId: 'cus_123' },
      } as any);
      stripeClient.getStripe.mockRejectedValue(new Error('Stripe error'));

      await expect(service.createCustomerPortalSession('user-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getPaymentMethods', () => {
    it('should return empty array if user has no brand', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', brand: null } as any);

      const result = await service.getPaymentMethods('user-123');
      expect(result).toEqual({ paymentMethods: [] });
    });

    it('should return empty array if brand has no stripeCustomerId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        brand: { stripeCustomerId: null },
      } as any);

      const result = await service.getPaymentMethods('user-123');
      expect(result).toEqual({ paymentMethods: [] });
    });
  });

  describe('getCircuitStatus', () => {
    it('should return circuit status from stripe client', () => {
      const status = service.getStripeCircuitStatus();
      expect(status).toEqual({ state: 'closed', failures: 0 });
    });
  });
});
