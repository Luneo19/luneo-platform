// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StripeConnectService } from '@/modules/marketplace/services/stripe-connect.service';
import { DistributedLockService } from '@/libs/redis/distributed-lock.service';

/**
 * Marketplace payout scheduler.
 * Runs every hour to process seller payouts for marketplace purchases
 * where payoutScheduledAt has passed (7 days after purchase) and payoutStatus is PENDING.
 *
 * Uses a distributed lock to prevent double payout in multi-instance deployments.
 */
@Injectable()
export class MarketplacePayoutScheduler {
  private readonly logger = new Logger(MarketplacePayoutScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly lock: DistributedLockService,
  ) {}

  @Cron('0 * * * *') // Every hour at minute 0
  async processMarketplacePayouts() {
    const acquired = await this.lock.acquire('marketplace-payout', 600);
    if (!acquired) {
      this.logger.debug('Marketplace payout skipped — another instance holds the lock');
      return;
    }
    try {
      const now = new Date();
      const pending = await this.prisma.marketplacePurchase.findMany({
        where: {
          payoutScheduledAt: { not: null, lt: now },
          payoutStatus: 'PENDING',
        },
        select: { id: true },
      });

      if (pending.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pending.length} marketplace purchase payout(s)`);

      for (const p of pending) {
        try {
          const result = await this.stripeConnect.processMarketplacePurchasePayout(p.id);
          if (!result.success) {
            this.logger.warn(`Payout failed for purchase ${p.id}: ${result.error ?? 'unknown'}`);
          }
        } catch (err) {
          this.logger.error(
            `Error processing payout for purchase ${p.id}:`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Marketplace payout run failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      await this.lock.release('marketplace-payout');
    }
  }
}
