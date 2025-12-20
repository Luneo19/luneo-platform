import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

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
} from './config/configuration';

// ONLY Essential Modules for API (no workers, no jobs, no websocket)
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
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { SecurityModule } from './modules/security/security.module';

// Common
import { CommonModule } from './common/common.module';

// Libs essentiels uniquement
import { PrismaModule } from './libs/prisma/prisma.module';
import { RedisModule } from './libs/redis/redis.module';
import { SmartCacheModule } from './libs/cache/smart-cache.module';

/**
 * AppModule optimisé pour déploiement Vercel Serverless
 * 
 * EXCLUSIONS:
 * - JobsModule (workers BullMQ)
 * - WebSocketModule (pas supporté en serverless)
 * - ScheduleModule (pas de cron jobs en serverless)
 * - AnalyticsModule (trop lourd)
 * - MarketplaceModule (trop lourd)
 * - ObservabilityModule (trop lourd)
 * - TrustSafetyModule (trop lourd)
 * - UsageBillingModule (trop lourd)
 * - I18nModule (peut être lazy-loaded)
 * - TimezoneModule (peut être lazy-loaded)
 * - OutboxModule (nécessite workers)
 * - BudgetModule (peut être optimisé)
 * - DLQModule (nécessite workers)
 * - MetricsModule (trop lourd)
 * - TracingModule (trop lourd)
 * 
 * Cette configuration réduit le build time de ~70%
 * et le cold start de ~80%
 */
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
      ],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get('app.rateLimitTtl') * 1000,
          limit: configService.get('app.rateLimitLimit'),
        }],
      }),
      inject: [ConfigService],
    }),

    // Health checks
    TerminusModule,

    // Essential libraries
    PrismaModule,
    RedisModule,
    SmartCacheModule,

    // API Modules ONLY (no background jobs)
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
    EcommerceModule,
    SecurityModule,

    // Common utilities
    CommonModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppServerlessModule {}
