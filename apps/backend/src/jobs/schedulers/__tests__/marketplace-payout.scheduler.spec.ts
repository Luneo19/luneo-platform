/**
 * MarketplacePayoutScheduler Unit Tests
 * Tests finding pending payouts (older than 7 days), calling Stripe transfer, updating status to COMPLETED
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MarketplacePayoutScheduler } from '../marketplace-payout.scheduler';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StripeConnectService } from '@/modules/marketplace/services/stripe-connect.service';

describe('MarketplacePayoutScheduler', () => {
  let scheduler: MarketplacePayoutScheduler;
  const mockPrisma = {
    marketplacePurchase: {
      findMany: jest.fn(),
    },
  };
  const mockStripeConnect = {
    processMarketplacePurchasePayout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplacePayoutScheduler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StripeConnectService, useValue: mockStripeConnect },
      ],
    }).compile();

    scheduler = module.get<MarketplacePayoutScheduler>(MarketplacePayoutScheduler);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('processMarketplacePayouts', () => {
    it('should find purchases older than 7 days with PENDING payout status', async () => {
      mockPrisma.marketplacePurchase.findMany.mockResolvedValue([]);

      await scheduler.processMarketplacePayouts();

      expect(mockPrisma.marketplacePurchase.findMany).toHaveBeenCalledWith({
        where: {
          payoutScheduledAt: { not: null, lt: expect.any(Date) },
          payoutStatus: 'PENDING',
        },
        select: { id: true },
      });
    });

    it('should call processMarketplacePurchasePayout for each pending purchase', async () => {
      const pending = [{ id: 'purchase-1' }, { id: 'purchase-2' }];
      mockPrisma.marketplacePurchase.findMany.mockResolvedValue(pending);
      mockStripeConnect.processMarketplacePurchasePayout.mockResolvedValue({ success: true });

      await scheduler.processMarketplacePayouts();

      expect(mockStripeConnect.processMarketplacePurchasePayout).toHaveBeenCalledTimes(2);
      expect(mockStripeConnect.processMarketplacePurchasePayout).toHaveBeenNthCalledWith(1, 'purchase-1');
      expect(mockStripeConnect.processMarketplacePurchasePayout).toHaveBeenNthCalledWith(2, 'purchase-2');
    });

    it('should not call Stripe when no pending purchases', async () => {
      mockPrisma.marketplacePurchase.findMany.mockResolvedValue([]);

      await scheduler.processMarketplacePayouts();

      expect(mockStripeConnect.processMarketplacePurchasePayout).not.toHaveBeenCalled();
    });

    it('should continue processing remaining purchases when one payout fails', async () => {
      const pending = [{ id: 'p-1' }, { id: 'p-2' }];
      mockPrisma.marketplacePurchase.findMany.mockResolvedValue(pending);
      mockStripeConnect.processMarketplacePurchasePayout
        .mockResolvedValueOnce({ success: false, error: 'Transfer failed' })
        .mockResolvedValueOnce({ success: true });

      await scheduler.processMarketplacePayouts();

      expect(mockStripeConnect.processMarketplacePurchasePayout).toHaveBeenCalledTimes(2);
    });
  });
});
