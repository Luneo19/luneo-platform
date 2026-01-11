/**
 * @fileoverview Module Analytics - Métriques et rapports
 * @module AnalyticsModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services
 * - ✅ Import des dépendances
 * - ✅ Structure modulaire
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsAdvancedController } from './controllers/analytics-advanced.controller';
import { PredictiveController } from './controllers/predictive.controller';
import { ReportsController } from './controllers/reports.controller';

// Services
import { AnalyticsService } from './services/analytics.service';
import { ABTestingService } from './services/ab-testing.service';
import { AttributionService } from './services/attribution.service';
import { AnalyticsAdvancedService } from './services/analytics-advanced.service';
import { AnalyticsCalculationsService } from './services/analytics-calculations.service';
import { PredictiveService } from './services/predictive.service';
import { ReportsService } from './services/reports.service';
import { MetricsService } from './services/metrics.service';
import { LLMRouterService } from '@/modules/agents/services/llm-router.service';
import { AgentsModule } from '@/modules/agents/agents.module';

// Infrastructure
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      {
        name: 'analytics-aggregation',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 20,
          attempts: 3,
        },
      },
      {
        name: 'reports-generation',
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 10,
          attempts: 2,
        },
      },
    ),
    AgentsModule, // Pour LLMRouterService
  ],
  controllers: [
    AnalyticsController,
    AnalyticsAdvancedController,
    PredictiveController,
    ReportsController,
  ],
  providers: [
    AnalyticsService,
    ABTestingService,
    AttributionService,
    AnalyticsAdvancedService,
    AnalyticsCalculationsService,
    PredictiveService,
    ReportsService,
    MetricsService,
  ],
  exports: [
    AnalyticsService,
    ABTestingService,
    AttributionService,
    AnalyticsAdvancedService,
    AnalyticsCalculationsService,
    PredictiveService,
    ReportsService,
    MetricsService,
  ],
})
export class AnalyticsModule {}


