import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { LearningService } from './learning.service';

@Processor(QUEUE_NAMES.LEARNING)
export class LearningProcessor {
  private readonly logger = new Logger(LearningProcessor.name);

  constructor(private readonly learningService: LearningService) {}

  @Process(JOB_TYPES.LEARNING.ANALYZE_SIGNALS)
  async analyzeSignals(job: Job<{ limit?: number }>) {
    this.logger.log(`Learning analyze-signals job started: ${job.id}`);
    const result = await this.learningService.analyzeUnprocessedSignals(job.data.limit ?? 200);
    this.logger.log(
      `Learning analyze-signals job completed: scanned=${result.scanned}, processed=${result.processed}`,
    );
    return result;
  }

  @Process(JOB_TYPES.LEARNING.AGGREGATE_VERTICAL)
  async aggregateVertical(job: Job<Record<string, never>>) {
    this.logger.log(`Learning aggregate-vertical job started: ${job.id}`);
    const result = await this.learningService.aggregateVerticalInsights();
    this.logger.log(
      `Learning aggregate-vertical job completed: verticals=${result.verticals}`,
    );
    return result;
  }
}
