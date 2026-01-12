import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

// Configuration
import {
    aiConfig,
    appConfig,
    cloudinaryConfig,
    databaseConfig,
    emailConfig,
    emailDomainConfig,
    jwtConfig,
    monitoringConfig,
    oauthConfig,
    redisConfig,
    stripeConfig,
} from './config/configuration';

// Modules
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ArStudioModule } from './modules/ar/ar-studio.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CreditsModule } from './modules/credits/credits.module';
import { DesignsModule } from './modules/designs/designs.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PlansModule } from './modules/plans/plans.module';
import { ProductEngineModule } from './modules/product-engine/product-engine.module';
import { ProductsModule } from './modules/products/products.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { RenderModule } from './modules/render/render.module';
import { SecurityModule } from './modules/security/security.module';
import { TrustSafetyModule } from './modules/trust-safety/trust-safety.module';
import { UsageBillingModule } from './modules/usage-billing/usage-billing.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { SupportModule } from './modules/support/support.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { SpecsModule } from './modules/specs/specs.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { PersonalizationModule } from './modules/personalization/personalization.module';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module';
import { WidgetModule } from './modules/widget/widget.module';
import { GenerationModule } from './modules/generation/generation.module';
import { EditorModule } from './modules/editor/editor.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { TeamModule } from './modules/team/team.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ClipartsModule } from './modules/cliparts/cliparts.module';
import { ReferralModule } from './modules/referral/referral.module';
import { CronJobsModule } from './modules/cron-jobs/cron-jobs.module';
import { CustomizationModule } from './modules/customization/customization.module';
import { BraceletModule } from './modules/bracelet/bracelet.module';

// Common
import { CommonModule } from './common/common.module';

// i18n & Timezone
import { I18nModule } from './libs/i18n/i18n.module';
import { TimezoneModule } from './libs/timezone/timezone.module';

// Jobs
import { JobsModule } from './jobs/jobs.module';
import { CacheableInterceptor } from './libs/cache/cacheable.interceptor';

// WebSocket

// Outbox & Budgets
import { DLQModule } from './jobs/dlq/dlq.module';
import { BudgetModule } from './libs/budgets/budget.module';
import { OutboxModule } from './libs/outbox/outbox.module';

// Metrics
import { MetricsModule } from './libs/metrics/metrics.module';

// Tracing
import { TracingModule } from './libs/tracing/tracing.module';
import { GlobalRateLimitGuard } from './common/guards/global-rate-limit.guard';
import { CacheModule } from './modules/cache/cache.module';
import { AuditModule } from './modules/audit/audit.module';

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

    // Event emitter
    EventEmitterModule.forRoot(),

    // Scheduled tasks (désactivé en serverless pour Vercel)
    ...(process.env.VERCEL ? [] : [ScheduleModule.forRoot()]),

    // BullMQ for job queues (optimisé pour serverless)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get('redis.url');
        const isUpstash = redisUrl?.includes('upstash.io') || redisUrl?.startsWith('rediss://');
        
        // BullMQ accepte soit une URL string, soit un objet de configuration
        // Pour Upstash avec TLS, utiliser l'URL directement (ioredis gère automatiquement TLS avec rediss://)
        const redisConfig = redisUrl ? (isUpstash ? {
          // Configuration objet pour Upstash avec options explicites
          host: redisUrl.split('@')[1]?.split(':')[0] || 'moved-gelding-21293.upstash.io',
          port: 6379,
          password: redisUrl.split('default:')[1]?.split('@')[0] || undefined,
          tls: {
            rejectUnauthorized: true,
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
          connectTimeout: 10000,
          commandTimeout: 5000,
        } : redisUrl) : undefined;

        return {
          redis: redisConfig || redisUrl,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
          // Optimisations pour serverless
          ...(process.env.VERCEL && {
            connection: {
              maxRetriesPerRequest: 3,
              enableReadyCheck: false,
              lazyConnect: true,
            },
          }),
        };
      },
      inject: [ConfigService],
    }),

    // Application modules
    AuthModule,
    UsersModule,
    BrandsModule,
    AgentsModule,
    ProductsModule,
    DesignsModule,
    OrdersModule,
    AiModule,
    // NOUVEAU: Modules 3D/AR + Personalization
    SpecsModule,
    SnapshotsModule,
    PersonalizationModule,
    ManufacturingModule,
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
    UsageBillingModule,
    WidgetModule,
    GenerationModule,
    SecurityModule,
    AnalyticsModule,
    ArStudioModule,
    MarketplaceModule,
    ObservabilityModule,
    TrustSafetyModule,
    CreditsModule,
    MonitoringModule,
    SupportModule,
    NotificationsModule,
    CollectionsModule,
    TeamModule,
    FavoritesModule,
    ClipartsModule,
    ReferralModule,
    CronJobsModule,
    CustomizationModule,
    BraceletModule,
    CollaborationModule,

    // Cache Module (Global)
    CacheModule,

    // Common utilities
    CommonModule,

    // i18n & Timezone for global platform
    I18nModule,
    TimezoneModule,

    // Job processing (conditionnel pour serverless)
    ...(process.env.VERCEL ? [] : [JobsModule]),

    // WebSocket for real-time collaboration (temporairement désactivé pour build)
    // WebSocketModule,

    // Outbox & Budgets
    OutboxModule,
    BudgetModule,
    DLQModule,

    // Metrics
    MetricsModule,

    // Tracing
    TracingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheableInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalRateLimitGuard,
    },
  ],
})
export class AppModule {}