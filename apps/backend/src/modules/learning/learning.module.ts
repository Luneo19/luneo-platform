import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { QueuesModule } from '@/libs/queues';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { LearningProcessor } from './learning.processor';
import { LearningScheduler } from './learning.scheduler';
import { SignalCollectorService } from './signal-collector.service';
import { GapDetectorService } from './gap-detector.service';
import { WeeklyAnalyzerService } from './weekly-analyzer.service';
import { VerticalAggregatorService } from './vertical-aggregator.service';
import { AutoImproverService } from './auto-improver.service';

@Module({
  imports: [PrismaOptimizedModule, QueuesModule],
  controllers: [LearningController],
  providers: [
    LearningService,
    LearningProcessor,
    LearningScheduler,
    SignalCollectorService,
    GapDetectorService,
    WeeklyAnalyzerService,
    VerticalAggregatorService,
    AutoImproverService,
  ],
  exports: [
    LearningService,
    SignalCollectorService,
    GapDetectorService,
    WeeklyAnalyzerService,
    VerticalAggregatorService,
    AutoImproverService,
  ],
})
export class LearningModule {}
