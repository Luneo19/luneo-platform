import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { LlmModule } from '@/libs/llm/llm.module';
import { FeatureFlagsModule } from '@/modules/feature-flags/feature-flags.module';
import { QueuesModule } from '@/libs/queues/queues.module';
import { AgentAnalyticsController } from './agent-analytics.controller';
import { AgentAnalyticsService } from './agent-analytics.service';
import { InsightsService } from './services/insights.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';
import { ConversionFunnelService } from './conversion-funnel.service';
import { RoiCalculatorService } from './roi-calculator.service';
import { BusinessImpactService } from './business-impact.service';
import { ScorecardService } from './scorecard.service';
import { AttributionV1Service } from './attribution-v1.service';
import { FlywheelAutomationService } from './flywheel-automation.service';
import { ReportGenerationProcessor } from './report-generation.processor';
import { ReportGenerationScheduler } from './report-generation.scheduler';

@Module({
  imports: [
    PrismaOptimizedModule,
    RedisOptimizedModule,
    LlmModule,
    FeatureFlagsModule,
    QueuesModule,
  ],
  controllers: [AgentAnalyticsController],
  providers: [
    AgentAnalyticsService,
    InsightsService,
    SentimentAnalysisService,
    ConversionFunnelService,
    RoiCalculatorService,
    BusinessImpactService,
    ScorecardService,
    AttributionV1Service,
    FlywheelAutomationService,
    ReportGenerationProcessor,
    ReportGenerationScheduler,
  ],
  exports: [
    AgentAnalyticsService,
    InsightsService,
    SentimentAnalysisService,
    ConversionFunnelService,
    RoiCalculatorService,
    BusinessImpactService,
    ScorecardService,
    AttributionV1Service,
    FlywheelAutomationService,
  ],
})
export class AgentAnalyticsModule {}
