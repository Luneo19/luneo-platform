import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TryOnController } from './controllers/try-on.controller';
import { WidgetTryOnController } from './controllers/widget-try-on.controller';
import { TryOnConfigurationService } from './services/try-on-configuration.service';
import { TryOnSessionService } from './services/try-on-session.service';
import { TryOnScreenshotService } from './services/try-on-screenshot.service';
import { ModelManagementService } from './services/model-management.service';
import { CalibrationService } from './services/calibration.service';
import { PerformanceService } from './services/performance.service';
import { TryOnEventsService } from './services/try-on-events.service';
import { ConversionService } from './services/conversion.service';
import { SocialSharingService } from './services/social-sharing.service';
import { TryOnRecommendationService } from './services/try-on-recommendation.service';
import { WhiteLabelService } from './services/white-label.service';
import { ModelOptimizationService } from './services/model-optimization.service';
import { TryOnAnalyticsDashboardService } from './services/try-on-analytics-dashboard.service';
import { TryOnBillingSyncService } from './services/try-on-billing-sync.service';
import { TryOnProcessor } from './jobs/try-on.processor';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { WebhooksModule } from '@/modules/webhooks/webhooks.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    forwardRef(() => UsageBillingModule),
    forwardRef(() => WebhooksModule),
    forwardRef(() => NotificationsModule),
    BullModule.registerQueue({ name: 'try-on-processing' }),
  ],
  controllers: [TryOnController, WidgetTryOnController],
  providers: [
    TryOnConfigurationService,
    TryOnSessionService,
    TryOnScreenshotService,
    ModelManagementService,
    CalibrationService,
    PerformanceService,
    TryOnEventsService,
    ConversionService,
    SocialSharingService,
    TryOnRecommendationService,
    WhiteLabelService,
    ModelOptimizationService,
    TryOnAnalyticsDashboardService,
    TryOnBillingSyncService,
    TryOnProcessor,
  ],
  exports: [
    TryOnConfigurationService,
    TryOnSessionService,
    TryOnScreenshotService,
    ModelManagementService,
    CalibrationService,
    PerformanceService,
    TryOnEventsService,
    ConversionService,
    SocialSharingService,
    TryOnRecommendationService,
    WhiteLabelService,
    ModelOptimizationService,
    TryOnAnalyticsDashboardService,
  ],
})
export class TryOnModule {}
