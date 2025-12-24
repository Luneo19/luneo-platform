import { Module } from '@nestjs/common';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { ABTestingService } from './services/ab-testing.service';
import { AttributionService } from './services/attribution.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ABTestingService, AttributionService],
  exports: [AnalyticsService, ABTestingService, AttributionService],
})
export class AnalyticsModule {}


