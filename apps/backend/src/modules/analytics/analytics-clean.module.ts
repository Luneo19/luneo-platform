import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AnalyticsCleanController } from './controllers/analytics-clean.controller';
import { AnalyticsCleanService } from './services/analytics-clean.service';
import { WebVitalsController } from './controllers/web-vitals.controller';
import { WebVitalsService } from './services/web-vitals.service';

/**
 * Clean Analytics Module - Minimaliste et performant
 * Focus sur l'essentiel : tracking d'événements, métriques de base, export
 */
@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [AnalyticsCleanController, WebVitalsController],
  providers: [AnalyticsCleanService, WebVitalsService],
  exports: [AnalyticsCleanService, WebVitalsService],
})
export class AnalyticsCleanModule {}
