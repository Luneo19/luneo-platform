import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JOB_TYPES, QueuesService } from '@/libs/queues';

@Injectable()
export class LearningScheduler {
  private readonly logger = new Logger(LearningScheduler.name);

  constructor(private readonly queuesService: QueuesService) {}

  // Every Sunday at 22:00 UTC
  @Cron('0 22 * * 0')
  async scheduleWeeklySignalAnalysis() {
    await this.queuesService.addLearningJob(
      JOB_TYPES.LEARNING.ANALYZE_SIGNALS,
      { limit: 1000 },
      { jobId: `learning:analyze:${new Date().toISOString().slice(0, 10)}` },
    );
    this.logger.log('Scheduled weekly learning signal analysis job');
  }

  // Every Monday at 06:00 UTC
  @Cron('0 6 * * 1')
  async scheduleVerticalAggregation() {
    await this.queuesService.addLearningJob(
      JOB_TYPES.LEARNING.AGGREGATE_VERTICAL,
      {},
      { jobId: `learning:aggregate:${new Date().toISOString().slice(0, 10)}` },
    );
    this.logger.log('Scheduled weekly vertical aggregation job');
  }

  // Fallback daily mini-analysis to keep backlog low
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scheduleDailyMiniAnalysis() {
    await this.queuesService.addLearningJob(
      JOB_TYPES.LEARNING.ANALYZE_SIGNALS,
      { limit: 300 },
    );
  }
}
