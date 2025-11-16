import { Module } from '@nestjs/common';
import { WebhookService } from './webhooks.service';
import { WebhookController } from './webhooks.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { HttpModule } from '@nestjs/axios';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { QuotaGuard } from '@/common/guards/quota.guard';

@Module({
  imports: [PrismaModule, SmartCacheModule, HttpModule, UsageBillingModule],
  providers: [WebhookService, QuotaGuard],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhooksModule {}


