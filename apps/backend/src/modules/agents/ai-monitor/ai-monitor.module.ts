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
import { EmailModule } from '@/modules/email/email.module';

// Services
import { TrackerService } from './services/tracker.service';
import { MetricsService } from './services/metrics.service';
import { LoggerService } from './services/logger.service';
import { AnalyticsService } from './services/analytics.service';
import { AlertsService } from './services/alerts.service';
import { AgentAlertsService } from './services/agent-alerts.service';

@Module({
  imports: [PrismaModule, SmartCacheModule, UsageGuardianModule, EmailModule],
  providers: [
    TrackerService,
    MetricsService,
    LoggerService,
    AnalyticsService,
    AlertsService,
    AgentAlertsService,
  ],
  exports: [
    TrackerService,
    MetricsService,
    LoggerService,
    AnalyticsService,
    AlertsService,
    AgentAlertsService,
  ],
})
export class AIMonitorModule {}
