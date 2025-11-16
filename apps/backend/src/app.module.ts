import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { HealthController } from './health.controller';

// Configuration
import {
  databaseConfig,
  redisConfig,
  jwtConfig,
  oauthConfig,
  stripeConfig,
  cloudinaryConfig,
  aiConfig,
  emailConfig,
  emailDomainConfig,
  appConfig,
  monitoringConfig,
  featureFlagsConfig,
  tracingConfig,
  shopifyConfig,
} from './config/configuration';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { DesignsModule } from './modules/designs/designs.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AiModule } from './modules/ai/ai.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { BillingModule } from './modules/billing/billing.module';
import { PlansModule } from './modules/plans/plans.module';
import { ProductEngineModule } from './modules/product-engine/product-engine.module';
import { RenderModule } from './modules/render/render.module';
import { ProductionModule } from './modules/production/production.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { ShopifyModule } from './modules/ecommerce/shopify/shopify.module';
import { UsageBillingModule } from './modules/usage-billing/usage-billing.module';
import { SecurityModule } from './modules/security/security.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { WidgetModule } from './modules/widget/widget.module';
import { DataModule } from './modules/data/data.module';

// Common
import { CommonModule } from './common/common.module';
import { LoggerModule } from './common/logger/logger.module';

// Jobs
import { JobsModule } from './jobs/jobs.module';
import type { RedisOptions } from 'ioredis';
import type { ConnectionOptions as TlsConnectionOptions } from 'tls';
import { HttpMetricsInterceptor } from './modules/observability/http-metrics.interceptor';

@Module({
  imports: [
    // Sentry for error monitoring
    SentryModule.forRoot(),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        jwtConfig,
        oauthConfig,
        stripeConfig,
        cloudinaryConfig,
        aiConfig,
        emailConfig,
        emailDomainConfig,
        appConfig,
        monitoringConfig,
        featureFlagsConfig,
        tracingConfig,
        shopifyConfig,
      ],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const ttlSeconds = configService.get<number>('app.rateLimitTtl') ?? 60;
        const limit = configService.get<number>('app.rateLimitLimit') ?? 100;

        return {
          throttlers: [
            {
              ttl: ttlSeconds * 1000,
              limit,
            },
          ],
        };
      },
      inject: [ConfigService],
    }),

    // Health checks
    TerminusModule,

    // Event emitter
    EventEmitterModule.forRoot(),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // BullMQ for job queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url') ?? 'redis://localhost:6379';
        const parsed = new URL(redisUrl);
        const connection: RedisOptions = {
          host: parsed.hostname,
          port: Number(parsed.port || '6379'),
        };

        if (parsed.password) {
          connection.password = parsed.password;
        }

        if (parsed.username) {
          connection.username = parsed.username;
        }

        if (parsed.protocol === 'rediss:') {
          connection.tls = {} as TlsConnectionOptions;
        }

        return {
          connection,
          prefix: 'luneo',
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    // Application modules
    AuthModule,
    UsersModule,
    BrandsModule,
    ProductsModule,
    DesignsModule,
    OrdersModule,
    AiModule,
    WebhooksModule,
    AdminModule,
    HealthModule,
    EmailModule,
    IntegrationsModule,
    PublicApiModule,
    BillingModule,
    PlansModule,
    ProductEngineModule,
    RenderModule,
    ProductionModule,
    EcommerceModule,
    ShopifyModule,
    UsageBillingModule,
    SecurityModule,
    AnalyticsModule,
    ObservabilityModule,
    FeatureFlagsModule,
    WidgetModule,
    DataModule,

    // Common utilities
    CommonModule,
    LoggerModule,

    // Job processing
    JobsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class AppModule {}
