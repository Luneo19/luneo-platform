import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { OAuthModule } from './oauth/oauth.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [
    ConfigModule, // SEC-09: Pour ApiKeyGuard
    PrismaModule,
    SmartCacheModule,
    ApiKeysModule,
    OAuthModule,
    RateLimitModule,
    WebhooksModule,
    AnalyticsModule,
  ],
  controllers: [PublicApiController],
  providers: [PublicApiService],
  exports: [PublicApiService],
})
export class PublicApiModule {}
