import { Module } from '@nestjs/common';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { ABTestingService } from './services/ab-testing.service';
import { AttributionService } from './services/attribution.service';
import { AnalyticsAdvancedService } from './services/analytics-advanced.service';
import { AnalyticsCalculationsService } from './services/analytics-calculations.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
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


