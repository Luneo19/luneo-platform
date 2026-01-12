/**
 * @fileoverview Module Analytics - Métriques et rapports
 * @module AnalyticsModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services
 * - ✅ Import des dépendances
 * - ✅ Structure modulaire
 */

import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsAdvancedController } from './controllers/analytics-advanced.controller';
// import { AdvancedAnalyticsController } from './controllers/advanced-analytics.controller'; // File not found
import { AnalyticsExportController } from './controllers/export.controller';
import { PredictiveController } from './controllers/predictive.controller';
import { ReportsController } from './controllers/reports.controller';
import { WebVitalsController } from './controllers/web-vitals.controller';

// Services
import { AnalyticsService } from './services/analytics.service';
import { ABTestingService } from './services/ab-testing.service';
import { AttributionService } from './services/attribution.service';
import { AnalyticsAdvancedService } from './services/analytics-advanced.service';
import { AdvancedAnalyticsService } from './services/advanced-analytics.service';
import { AnalyticsExportService } from './services/export.service';
import { AnalyticsCalculationsService } from './services/analytics-calculations.service';
import { PredictiveService } from './services/predictive.service';
import { ReportsService } from './services/reports.service';
import { MetricsService } from './services/metrics.service';
import { WebVitalsService } from './services/web-vitals.service';

// Infrastructure
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { AgentsModule } from '@/modules/agents/agents.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    RedisOptimizedModule,
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
    forwardRef(() => AgentsModule), // Pour LLMRouterService - utiliser forwardRef pour éviter dépendance circulaire
  ],
  controllers: [
    AnalyticsController,
    AnalyticsAdvancedController,
    // AdvancedAnalyticsController, // File not found
    AnalyticsExportController,
    PredictiveController,
    ReportsController,
    WebVitalsController,
  ],
  providers: [
    AnalyticsService,
    ABTestingService,
    AttributionService,
    AnalyticsAdvancedService,
    AdvancedAnalyticsService,
    AnalyticsExportService,
    AnalyticsCalculationsService,
    PredictiveService,
    ReportsService,
    MetricsService,
    WebVitalsService,
  ],
  exports: [
    AnalyticsService,
    ABTestingService,
    AttributionService,
    AnalyticsAdvancedService,
    AdvancedAnalyticsService,
    AnalyticsExportService,
    AnalyticsCalculationsService,
    PredictiveService,
    ReportsService,
    MetricsService,
    WebVitalsService,
  ],
})
export class AnalyticsModule {}


