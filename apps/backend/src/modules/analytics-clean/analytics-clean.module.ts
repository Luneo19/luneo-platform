import { Module } from '@nestjs/common';
import { AnalyticsCleanController } from './analytics-clean.controller';
import { WebVitalsController } from './web-vitals.controller';

@Module({
  controllers: [AnalyticsCleanController, WebVitalsController],
})
export class AnalyticsCleanModule {}
