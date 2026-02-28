import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JOB_TYPES, QueuesService } from '@/libs/queues';

@Injectable()
export class ReportGenerationScheduler {
  constructor(private readonly queuesService: QueuesService) {}

  // Every Monday at 05:00 UTC
  @Cron('0 5 * * 1')
  async scheduleWeeklyScorecardReports() {
    const weekKey = new Date().toISOString().slice(0, 10);
    await this.queuesService.addAnalyticsAggregationJob(
      JOB_TYPES.ANALYTICS_AGGREGATION.GENERATE_SCORECARD_REPORT,
      { daysWindow: 30 },
      { jobId: `scorecard-report:${weekKey}` },
    );
  }
}
