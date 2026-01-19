import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AnalyticsCleanController } from './controllers/analytics-clean.controller';
import { AnalyticsCleanService } from './services/analytics-clean.service';

/**
 * Clean Analytics Module - Minimaliste et performant
 * Focus sur l'essentiel : tracking d'événements, métriques de base, export
 */
@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [AnalyticsCleanController],
  providers: [AnalyticsCleanService],
  exports: [AnalyticsCleanService],
})
export class AnalyticsCleanModule {}
