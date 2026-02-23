import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsageReconciliationService } from '@/modules/usage-billing/services/usage-reconciliation.service';
import { DistributedLockService } from '@/libs/redis/distributed-lock.service';

/**
 * Scheduler pour la reconciliation quotidienne des metriques d'usage.
 * Compare les UsageMetric locaux avec les usage records Stripe.
 * Execute tous les jours a 03:00 UTC.
 *
 * Uses a distributed lock to prevent double execution in multi-instance deployments.
 */
@Injectable()
export class UsageReconciliationScheduler {
  private readonly logger = new Logger(UsageReconciliationScheduler.name);

  constructor(
    private readonly lock: DistributedLockService,
    @Optional() private readonly reconciliationService?: UsageReconciliationService,
  ) {}

  @Cron('0 3 * * *') // Daily at 03:00 UTC
  async runDailyReconciliation() {
    if (!this.reconciliationService) {
      this.logger.warn('UsageReconciliationService not available, skipping reconciliation');
      return;
    }

    const acquired = await this.lock.acquire('usage-reconciliation', 1800);
    if (!acquired) {
      this.logger.debug('Usage reconciliation skipped — another instance holds the lock');
      return;
    }

    this.logger.log('Starting daily usage reconciliation...');
    try {
      const report = await this.reconciliationService.runDailyReconciliation();
      this.logger.log(
        `Reconciliation complete: ${report.brandsChecked} brands, ${report.discrepancies.length} discrepancies, ${report.errors.length} errors`,
      );
    } catch (error) {
      this.logger.error(`Reconciliation failed: ${(error as Error).message}`);
    } finally {
      await this.lock.release('usage-reconciliation');
    }
  }
}
