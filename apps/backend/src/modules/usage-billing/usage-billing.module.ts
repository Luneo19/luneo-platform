import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { UsageBillingController } from './usage-billing.controller';
import { UsageMeteringService } from './services/usage-metering.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { QuotasService } from './services/quotas.service';
import { BillingCalculationService } from './services/billing-calculation.service';
import { UsageReportingService } from './services/usage-reporting.service';
import { UsageReconciliationService } from './services/usage-reconciliation.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    BillingModule,
    BullModule.registerQueue({
      name: 'usage-metering',
    }),
  ],
  controllers: [UsageBillingController],
  providers: [
    UsageMeteringService,
    UsageTrackingService,
    QuotasService,
    BillingCalculationService,
    UsageReportingService,
    UsageReconciliationService,
  ],
  exports: [
    UsageMeteringService,
    UsageTrackingService,
    QuotasService,
    UsageReconciliationService,
  ],
})
export class UsageBillingModule {}


