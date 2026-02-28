import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB_TYPES, QueuesService } from '@/libs/queues';

@Injectable()
export class BillingUsageScheduler {
  constructor(private readonly queuesService: QueuesService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleUsageSync() {
    const hourKey = new Date().toISOString().slice(0, 13);
    await this.queuesService.addAnalyticsAggregationJob(
      JOB_TYPES.ANALYTICS_AGGREGATION.SYNC_BILLING_USAGE,
      {},
      { jobId: `billing-usage-sync:${hourKey}` },
    );
  }
}
