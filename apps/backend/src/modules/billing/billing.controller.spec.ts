/**
 * BillingController - Tests unitaires
 * TEST-06: Tests Controllers critiques
 * Tests pour les endpoints de facturation Stripe
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let billingService: jest.Mocked<BillingService>;

  // Mock request object
  const mockRequest = (userId?: string) => ({
    user: userId ? { id: userId, email: 'test@example.com' } : undefined,
    rawBody: Buffer.from('{}'),
  });

  beforeEach(async () => {
    const mockBillingService = {
      createCheckoutSession: jest.fn(),
      getSubscription: jest.fn(),
      getInvoices: jest.fn(),
      getPaymentMethods: jest.fn(),
      addPaymentMethod: jest.fn(),
      removePaymentMethod: jest.fn(),
      createCustomerPortalSession: jest.fn(),
      handleStripeWebhook: jest.fn(),
      getStripe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    billingService = module.get(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /billing/create-checkout-session', () => {
    const checkoutBody = {
      planId: 'pro',
      email: 'user@example.com',
      billingInterval: 'monthly' as const,
      addOns: [{ type: 'extra-storage', quantity: 1 }],
    };

    it('should create a checkout session successfully', async () => {
      const mockResult = {
        success: true,
        url: 'https://checkout.stripe.com/session/cs_test_123',
        sessionId: 'cs_test_123',
      };

      billingService.createCheckoutSession.mockResolvedValue(mockResult);

      const result = await controller.createCheckoutSession(checkoutBody);

      expect(billingService.createCheckoutSession).toHaveBeenCalledWith(
        'pro',
        'anonymous',
        'user@example.com',
        {
          billingInterval: 'monthly',
          addOns: [{ type: 'extra-storage', quantity: 1 }],
        }
      );
      expect(result).toEqual(mockResult);
    });

    it('should return error when service fails', async () => {
      billingService.createCheckoutSession.mockRejectedValue(
        new Error('Invalid plan ID')
      );

      const result = await controller.createCheckoutSession(checkoutBody);

      expect(result).toEqual({
        success: false,
        error: 'Invalid plan ID',
      });
    });

    it('should use default email when not provided', async () => {
      const mockResult = { success: true, sessionId: 'sess_123', url: 'https://checkout.stripe.com/...' };
      billingService.createCheckoutSession.mockResolvedValue(mockResult as any);

      await controller.createCheckoutSession({ planId: 'pro' });

      expect(billingService.createCheckoutSession).toHaveBeenCalledWith(
        'pro',
        'anonymous',
        'user@example.com',
        { billingInterval: 'monthly', addOns: undefined }
      );
    });
  });

  describe('GET /billing/subscription', () => {
    it('should return user subscription', async () => {
      const mockSubscription = {
        plan: 'starter',
        status: 'active',
        limits: { designsPerMonth: 100, teamMembers: 5, storageGB: 10, apiAccess: true, advancedAnalytics: false, prioritySupport: false, customExport: false, whiteLabel: false },
        currentUsage: { designsUsed: 50, teamMembersUsed: 2, storageUsedGB: 5 },
        expiresAt: new Date().toISOString(),
        stripeSubscriptionId: 'sub_123',
      };

      billingService.getSubscription.mockResolvedValue(mockSubscription as any);

      const req = mockRequest('user_123') as any;
      const result = await controller.getSubscription(req);

      expect(billingService.getSubscription).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when no subscription exists', async () => {
      billingService.getSubscription.mockResolvedValue(null as any);

      const req = mockRequest('user_123') as any;
      const result = await controller.getSubscription(req);

      expect(result).toBeNull();
    });
  });

  describe('GET /billing/invoices', () => {
    it('should return user invoices with pagination', async () => {
      const mockInvoices = {
        invoices: [
          { id: 'in_123', number: 'INV-001', amount: 2900, currency: 'usd', status: 'paid', created: Date.now(), dueDate: Date.now(), paidAt: Date.now(), invoicePdf: '', hostedInvoiceUrl: '', lineItems: [] },
          { id: 'in_124', number: 'INV-002', amount: 2900, currency: 'usd', status: 'paid', created: Date.now(), dueDate: Date.now(), paidAt: Date.now(), invoicePdf: '', hostedInvoiceUrl: '', lineItems: [] },
        ],
        pagination: { total: 10, page: 1, limit: 20 },
      };

      billingService.getInvoices.mockResolvedValue(mockInvoices as any);

      const req = mockRequest('user_123') as any;
      const result = await controller.getInvoices(req, '1', '20');

      expect(billingService.getInvoices).toHaveBeenCalledWith('user_123', 1, 20);
      expect(result).toEqual(mockInvoices);
    });

    it('should use default pagination values', async () => {
      billingService.getInvoices.mockResolvedValue({ invoices: [], total: 0 } as any);

      const req = mockRequest('user_123') as any;
      await controller.getInvoices(req, undefined, undefined);

      expect(billingService.getInvoices).toHaveBeenCalledWith('user_123', 1, 20);
    });
  });

  describe('GET /billing/payment-methods', () => {
    it('should return user payment methods', async () => {
      const mockPaymentMethods = {
        paymentMethods: [
          { id: 'pm_123', type: 'card', card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2027 }, created: Date.now() },
          { id: 'pm_124', type: 'card', card: { brand: 'mastercard', last4: '5555', exp_month: 6, exp_year: 2028 }, created: Date.now() },
        ],
      };

      billingService.getPaymentMethods.mockResolvedValue(mockPaymentMethods as any);

      const req = mockRequest('user_123') as any;
      const result = await controller.getPaymentMethods(req);

      expect(billingService.getPaymentMethods).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(mockPaymentMethods);
    });
  });

  describe('POST /billing/payment-methods', () => {
    it('should add a payment method', async () => {
      const mockResult = {
        paymentMethod: { id: 'pm_123', attached: true, setAsDefault: true },
        message: 'Payment method added successfully',
      };
      billingService.addPaymentMethod.mockResolvedValue(mockResult);

      const req = mockRequest('user_123') as any;
      const result = await controller.addPaymentMethod(req, {
        paymentMethodId: 'pm_123',
        setAsDefault: true,
      });

      expect(billingService.addPaymentMethod).toHaveBeenCalledWith(
        'user_123',
        'pm_123',
        true
      );
      expect(result).toEqual(mockResult);
    });

    it('should default setAsDefault to false', async () => {
      const mockResult = {
        paymentMethod: { id: 'pm_123', attached: true, setAsDefault: false },
        message: 'Payment method added successfully',
      };
      billingService.addPaymentMethod.mockResolvedValue(mockResult);

      const req = mockRequest('user_123') as any;
      await controller.addPaymentMethod(req, { paymentMethodId: 'pm_123' });

      expect(billingService.addPaymentMethod).toHaveBeenCalledWith(
        'user_123',
        'pm_123',
        false
      );
    });
  });

  describe('DELETE /billing/payment-methods', () => {
    it('should remove a payment method', async () => {
      const mockResult = { message: 'Payment method removed' };
      billingService.removePaymentMethod.mockResolvedValue(mockResult);

      const req = mockRequest('user_123') as any;
      const result = await controller.removePaymentMethod(req, 'pm_123');

      expect(billingService.removePaymentMethod).toHaveBeenCalledWith(
        'user_123',
        'pm_123'
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestException when ID is missing', async () => {
      const req = mockRequest('user_123') as any;
      
      await expect(
        controller.removePaymentMethod(req, undefined as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /billing/customer-portal', () => {
    it('should create a customer portal session', async () => {
      const mockResult = {
        success: true,
        url: 'https://billing.stripe.com/session/bps_123',
      };

      billingService.createCustomerPortalSession.mockResolvedValue(mockResult);

      const req = mockRequest('user_123') as any;
      const result = await controller.createCustomerPortalSession(req);

      expect(billingService.createCustomerPortalSession).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(mockResult);
    });

    it('should return error when service fails', async () => {
      billingService.createCustomerPortalSession.mockRejectedValue(
        new Error('No Stripe customer found')
      );

      const req = mockRequest('user_123') as any;
      const result = await controller.createCustomerPortalSession(req);

      expect(result).toEqual({
        success: false,
        error: 'No Stripe customer found',
      });
    });
  });

  describe('POST /billing/webhook', () => {
    const mockStripeEvent = {
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123' } },
    };

    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
      // Mock getStripe to return an object with webhooks.constructEvent that returns the event
      billingService.getStripe = jest.fn().mockResolvedValue({
        webhooks: {
          constructEvent: jest.fn().mockReturnValue(mockStripeEvent),
        },
      } as any);
    });

    afterEach(() => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    });

    it('should process webhook successfully', async () => {
      billingService.handleStripeWebhook.mockResolvedValue({ processed: true });

      const req = { rawBody: Buffer.from('{}') } as any;
      const result = await controller.handleWebhook(req, 'sig_test_123');

      expect(result).toEqual({ received: true, processed: true });
    });

    it('should throw BadRequestException when signature is missing', async () => {
      const req = { rawBody: Buffer.from('{}') } as any;

      await expect(
        controller.handleWebhook(req, undefined as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when webhook secret is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const req = { rawBody: Buffer.from('{}') } as any;

      await expect(
        controller.handleWebhook(req, 'sig_test_123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid signature', async () => {
      // Override the mock to throw an error
      billingService.getStripe = jest.fn().mockResolvedValue({
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error('Invalid signature');
          }),
        },
      } as any);

      const req = { rawBody: Buffer.from('{}') } as any;

      await expect(
        controller.handleWebhook(req, 'invalid_sig')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
