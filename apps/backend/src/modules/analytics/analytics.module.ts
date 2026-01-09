import { Module } from '@nestjs/common';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsAdvancedController } from './controllers/analytics-advanced.controller';
import { AnalyticsService } from './services/analytics.service';
import { ABTestingService } from './services/ab-testing.service';
import { AttributionService } from './services/attribution.service';
import { AnalyticsAdvancedService } from './services/analytics-advanced.service';
import { AnalyticsCalculationsService } from './services/analytics-calculations.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [AnalyticsController, AnalyticsAdvancedController],
  providers: [
    AnalyticsService,
    ABTestingService,
    AttributionService,
    AnalyticsAdvancedService,
    AnalyticsCalculationsService,
  ],
  exports: [
    AnalyticsService,
    ABTestingService,
    AttributionService,
    AnalyticsAdvancedService,
    AnalyticsCalculationsService,
  ],
})
export class AnalyticsModule {}


