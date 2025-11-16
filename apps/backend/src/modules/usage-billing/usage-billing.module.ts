import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsageBillingController } from './usage-billing.controller';
import { UsageMeteringService } from './services/usage-metering.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { QuotasService } from './services/quotas.service';
import { BillingCalculationService } from './services/billing-calculation.service';
import { UsageReportingService } from './services/usage-reporting.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { QueueNames } from '@/jobs/queue.constants';
import { UsageQueueService } from './services/usage-queue.service';
import { ObservabilityModule } from '@/modules/observability/observability.module';
import { QuotaMetricsService } from './services/quota-metrics.service';
import { QuotaAlertListenerService } from './services/quota-alert-listener.service';
import { IntegrationsModule } from '@/modules/integrations/integrations.module';
import { EmailModule } from '@/modules/email/email.module';
import { UsageTopUpService } from './services/usage-topup.service';
import { UsageTopUpListener } from './services/usage-topup.listener';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    BillingModule,
    ObservabilityModule,
    IntegrationsModule,
    EmailModule,
    BullModule.registerQueue({
      name: QueueNames.USAGE_METERING,
    }),
  ],
  controllers: [UsageBillingController],
  providers: [
    UsageMeteringService,
    UsageTrackingService,
    QuotasService,
    BillingCalculationService,
    UsageReportingService,
    UsageQueueService,
    QuotaMetricsService,
    QuotaAlertListenerService,
    UsageTopUpService,
    UsageTopUpListener,
  ],
  exports: [
    UsageMeteringService,
    UsageTrackingService,
    QuotasService,
    UsageQueueService,
    QuotaMetricsService,
    UsageTopUpService,
  ],
})
export class UsageBillingModule {}


