import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { GapDetectorService } from './gap-detector.service';
import { VerticalAggregatorService } from './vertical-aggregator.service';
import { WeeklyAnalyzerService } from './weekly-analyzer.service';
import { AutoImproverService } from './auto-improver.service';

@Processor(QUEUE_NAMES.LEARNING)
export class LearningProcessor {
  private readonly logger = new Logger(LearningProcessor.name);

  constructor(
    private readonly gapDetectorService: GapDetectorService,
    private readonly verticalAggregatorService: VerticalAggregatorService,
    private readonly weeklyAnalyzerService: WeeklyAnalyzerService,
    private readonly autoImproverService: AutoImproverService,
  ) {}

  @Process(JOB_TYPES.LEARNING.ANALYZE_SIGNALS)
  async analyzeSignals(job: Job<{ limit?: number }>) {
    this.logger.log(`Learning analyze-signals job started: ${job.id}`);
    const result = await this.gapDetectorService.detectFromBacklog(job.data.limit ?? 200);
    const weeklySummary = await this.weeklyAnalyzerService.generateWeeklySummary();
    const proposals = await this.autoImproverService.proposeTopImprovements(5);
    this.logger.log(
      `Learning analyze-signals job completed: scanned=${result.scanned}, processed=${result.processed}`,
    );
    return { ...result, weeklySummary, proposals };
  }

  @Process(JOB_TYPES.LEARNING.AGGREGATE_VERTICAL)
  async aggregateVertical(job: Job<Record<string, never>>) {
    this.logger.log(`Learning aggregate-vertical job started: ${job.id}`);
    const result = await this.verticalAggregatorService.aggregateCrossTenantInsights();
    this.logger.log(
      `Learning aggregate-vertical job completed: verticals=${result.verticals}`,
    );
    return result;
  }
}
