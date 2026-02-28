import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB_TYPES, QueuesService } from '@/libs/queues';

@Injectable()
export class RoiScheduler {
  constructor(private readonly queuesService: QueuesService) {}

  // Hourly lightweight snapshot generation for ROI trending
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleHourlyRoiSnapshot() {
    await this.queuesService.addAnalyticsAggregationJob(
      JOB_TYPES.ANALYTICS_AGGREGATION.GENERATE_REPORT,
      {},
    );
  }
}
