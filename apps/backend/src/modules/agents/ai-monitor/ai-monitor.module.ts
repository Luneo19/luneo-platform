/**
 * @fileoverview Module AI Monitor - Monitoring et analytics des agents IA
 * @module AIMonitorModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services utilisés par d'autres modules
 * - ✅ Import des dépendances nécessaires
 * - ✅ Structure NestJS standard
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { UsageGuardianModule } from '../usage-guardian/usage-guardian.module';

// Services
import { TrackerService } from './services/tracker.service';
import { MetricsService } from './services/metrics.service';
import { LoggerService } from './services/logger.service';
import { AnalyticsService } from './services/analytics.service';
import { AlertsService } from './services/alerts.service';

@Module({
  imports: [PrismaModule, SmartCacheModule, UsageGuardianModule],
  providers: [
    TrackerService,
    MetricsService,
    LoggerService,
    AnalyticsService,
    AlertsService,
  ],
  exports: [
    // ✅ RÈGLE: Exporter tous les services utilisés ailleurs
    TrackerService,
    MetricsService,
    LoggerService,
    AnalyticsService,
    AlertsService,
  ],
})
export class AIMonitorModule {}
