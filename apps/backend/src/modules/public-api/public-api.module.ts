import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { OAuthModule } from './oauth/oauth.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { QuotaGuard } from '@/common/guards/quota.guard';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    ApiKeysModule,
    OAuthModule,
    RateLimitModule,
    WebhooksModule,
    AnalyticsModule,
    UsageBillingModule,
  ],
  controllers: [PublicApiController],
  providers: [PublicApiService, QuotaGuard],
  exports: [PublicApiService],
})
export class PublicApiModule {}
