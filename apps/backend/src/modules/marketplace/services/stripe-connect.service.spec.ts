import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { StripeConnectService } from './stripe-connect.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('StripeConnectService', () => {
  let service: StripeConnectService;

  const mockPrismaService = {
    artisan: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workOrder: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    payout: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    marketplacePurchase: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStripeAccount = {
    id: 'acct_123',
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    requirements: {},
  };

  const mockAccountLink = { url: 'https://connect.stripe.com/setup/s/xxx' };

  const mockStripe = {
    accounts: {
      create: jest.fn().mockResolvedValue(mockStripeAccount),
      retrieve: jest.fn().mockResolvedValue(mockStripeAccount),
    },
    accountLinks: {
      create: jest.fn().mockResolvedValue(mockAccountLink),
    },
    transfers: {
      create: jest.fn().mockResolvedValue({ id: 'tr_123' }),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'stripe.secretKey') return 'sk_test_xxx';
      if (key === 'app.frontendUrl') return 'https://app.luneo.io';
      if (key === 'marketplace.connectFeesPercent') return 2;
      if (key === 'marketplace.minPayoutCents') return 1000;
      if (key === 'marketplace.platformFeePercent') return 10;
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Re-apply Stripe mock return values (cleared by clearAllMocks)
    mockStripe.accounts.create.mockResolvedValue(mockStripeAccount);
    mockStripe.accounts.retrieve.mockResolvedValue(mockStripeAccount);
    mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);
    mockStripe.transfers.create.mockResolvedValue({ id: 'tr_123' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeConnectService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StripeConnectService>(StripeConnectService);
    // Replace private getStripe so tests use mock Stripe without dynamic import
    (service as unknown as { getStripe: () => Promise<typeof mockStripe> }).getStripe =
      jest.fn().mockResolvedValue(mockStripe);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSellerConnectAccount', () => {
    it('should return existing account link when artisan already has Stripe account', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        userId: 'user-1',
        stripeAccountId: 'acct_existing',
      });
      mockStripe.accountLinks.create.mockResolvedValue({
        url: 'https://connect.stripe.com/refresh/xxx',
      });

      const result = await service.createSellerConnectAccount(
        'user-1',
        'user@example.com',
        {},
      );

      expect(result.accountId).toBe('acct_existing');
      expect(result.onboardingUrl).toBe('https://connect.stripe.com/refresh/xxx');
      expect(result.isExisting).toBe(true);
      expect(mockStripe.accounts.create).not.toHaveBeenCalled();
    });

    it('should create new Connect account and artisan when no existing account', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue(null);
      mockPrismaService.artisan.create.mockResolvedValue({
        id: 'artisan-1',
        userId: 'user-1',
        stripeAccountId: 'acct_123',
        stripeAccountStatus: 'pending',
      });

      const result = await service.createSellerConnectAccount(
        'user-1',
        'user@example.com',
        { country: 'FR', businessName: 'My Shop' },
      );

      expect(result.accountId).toBe('acct_123');
      expect(result.onboardingUrl).toBe(mockAccountLink.url);
      expect(result.isExisting).toBe(false);
      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          country: 'FR',
          email: 'user@example.com',
        }),
      );
      expect(mockPrismaService.artisan.create).toHaveBeenCalled();
    });

    it('should handle Stripe API failure', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue(null);
      mockStripe.accounts.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        service.createSellerConnectAccount('user-1', 'user@example.com', {}),
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('getSellerConnectStatus', () => {
    it('should return hasAccount: false when no artisan or no stripeAccountId', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue(null);

      const result = await service.getSellerConnectStatus('user-1');

      expect(result.hasAccount).toBe(false);
      expect(mockStripe.accounts.retrieve).not.toHaveBeenCalled();
    });

    it('should return hasAccount: false when artisan has no stripeAccountId', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        userId: 'user-1',
        stripeAccountId: null,
        stripeAccountStatus: null,
        createdAt: new Date(),
      });

      const result = await service.getSellerConnectStatus('user-1');

      expect(result.hasAccount).toBe(false);
    });

    it('should return status from Stripe and update local when account exists', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        userId: 'user-1',
        stripeAccountId: 'acct_123',
        stripeAccountStatus: 'pending',
        createdAt: new Date(),
      });
      mockPrismaService.artisan.update.mockResolvedValue({});

      const result = await service.getSellerConnectStatus('user-1');

      expect(result.hasAccount).toBe(true);
      expect(result.accountId).toBe('acct_123');
      expect(result.chargesEnabled).toBe(true);
      expect(result.payoutsEnabled).toBe(true);
      expect(result.detailsSubmitted).toBe(true);
      expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith('acct_123');
    });

    it('should handle Stripe API failure on retrieve', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        userId: 'user-1',
        stripeAccountId: 'acct_123',
      });
      mockStripe.accounts.retrieve.mockRejectedValue(new Error('Stripe network error'));

      await expect(service.getSellerConnectStatus('user-1')).rejects.toThrow(
        'Stripe network error',
      );
    });
  });

  describe('createPayout', () => {
    it('should throw NotFoundException when artisan not found or no Stripe account', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayout('artisan-1', ['wo-1']),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createPayout('artisan-1', ['wo-1']),
      ).rejects.toThrow(/not found or Stripe account not set up/);
    });

    it('should throw NotFoundException when artisan has no stripeAccountId', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        stripeAccountId: null,
      });

      await expect(
        service.createPayout('artisan-1', ['wo-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no pending work orders', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        stripeAccountId: 'acct_123',
      });
      mockPrismaService.workOrder.findMany.mockResolvedValue([]);

      await expect(
        service.createPayout('artisan-1', ['wo-1']),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createPayout('artisan-1', ['wo-1']),
      ).rejects.toThrow('No pending work orders found');
    });

    it('should throw NotFoundException when net amount below minimum', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        stripeAccountId: 'acct_123',
      });
      mockPrismaService.workOrder.findMany.mockResolvedValue([
        { id: 'wo-1', payoutAmountCents: 100 },
      ]);
      mockPrismaService.payout.create.mockResolvedValue({
        id: 'payout-1',
        artisanId: 'artisan-1',
        amountCents: 100,
        feesCents: 2,
        netAmountCents: 98,
        workOrderIds: ['wo-1'],
        status: 'PENDING',
      });

      await expect(
        service.createPayout('artisan-1', ['wo-1']),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createPayout('artisan-1', ['wo-1']),
      ).rejects.toThrow(/below the minimum/);
    });

    it('should create payout and transfer when amount above minimum', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        stripeAccountId: 'acct_123',
      });
      mockPrismaService.workOrder.findMany.mockResolvedValue([
        { id: 'wo-1', payoutAmountCents: 2000 },
      ]);
      mockPrismaService.payout.create.mockResolvedValue({
        id: 'payout-1',
        artisanId: 'artisan-1',
        amountCents: 2000,
        feesCents: 40,
        netAmountCents: 1960,
        workOrderIds: ['wo-1'],
        status: 'PENDING',
      });
      mockPrismaService.payout.update.mockResolvedValue({});
      mockPrismaService.workOrder.updateMany.mockResolvedValue({});

      const result = await service.createPayout('artisan-1', ['wo-1']);

      expect(result.payout).toBeDefined();
      expect(result.transfer).toEqual({ id: 'tr_123' });
      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1960,
          destination: 'acct_123',
          metadata: expect.objectContaining({ payoutId: 'payout-1' }),
        }),
      );
    });

    it('should mark payout as FAILED when Stripe transfer fails', async () => {
      mockPrismaService.artisan.findUnique.mockResolvedValue({
        id: 'artisan-1',
        stripeAccountId: 'acct_123',
      });
      mockPrismaService.workOrder.findMany.mockResolvedValue([
        { id: 'wo-1', payoutAmountCents: 2000 },
      ]);
      mockPrismaService.payout.create.mockResolvedValue({
        id: 'payout-1',
        artisanId: 'artisan-1',
        amountCents: 2000,
        feesCents: 40,
        netAmountCents: 1960,
        workOrderIds: ['wo-1'],
        status: 'PENDING',
      });
      mockStripe.transfers.create.mockRejectedValue(new Error('Stripe transfer failed'));
      mockPrismaService.payout.update.mockResolvedValue({});

      await expect(service.createPayout('artisan-1', ['wo-1'])).rejects.toThrow(
        'Stripe transfer failed',
      );
      expect(mockPrismaService.payout.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });
  });

  describe('processMarketplacePurchasePayout', () => {
    it('should create Stripe transfer and update payout status to COMPLETED', async () => {
      mockPrismaService.marketplacePurchase.findUnique.mockResolvedValue({
        id: 'mp-1',
        payoutStatus: 'PENDING',
        price: 50,
        currency: 'CHF',
        item: {
          sellerId: 'brand-seller',
          seller: { users: [{ id: 'user-1' }] },
        },
      });
      mockPrismaService.artisan.findFirst.mockResolvedValue({
        id: 'artisan-1',
        stripeAccountId: 'acct_seller',
        stripeAccountStatus: 'active',
      });
      mockPrismaService.marketplacePurchase.update.mockResolvedValue({});

      const result = await service.processMarketplacePurchasePayout('mp-1');

      expect(result.success).toBe(true);
      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 4500, // 50 * 100 - 10% = 4500 cents
          currency: 'chf',
          destination: 'acct_seller',
          metadata: expect.objectContaining({ marketplacePurchaseId: 'mp-1' }),
        }),
      );
      expect(mockPrismaService.marketplacePurchase.update).toHaveBeenCalledWith({
        where: { id: 'mp-1' },
        data: {
          payoutStatus: 'COMPLETED',
          paidOutAt: expect.any(Date),
        },
      });
    });
  });
});
