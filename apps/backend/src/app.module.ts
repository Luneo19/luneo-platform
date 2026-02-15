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
    gelatoConfig,
    jwtConfig,
    marketplaceConfig,
    monitoringConfig,
    oauthConfig,
    printfulConfig,
    printifyConfig,
    redisConfig,
    referralConfig,
    stripeConfig,
    validateConfig,
} from './config/configuration';

// Modules
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnalyticsCleanModule } from './modules/analytics/analytics-clean.module';
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
import { EnterpriseModule } from './modules/enterprise/enterprise.module'; // ✅ PHASE 8
import { ObservabilityModule } from './modules/observability/observability.module';
import { OrionModule } from './modules/orion/orion.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { PlansModule } from './modules/plans/plans.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ProductEngineModule } from './modules/product-engine/product-engine.module';
import { ProductsModule } from './modules/products/products.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { RenderModule } from './modules/render/render.module';
import { SecurityModule } from './modules/security/security.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TrustSafetyModule } from './modules/trust-safety/trust-safety.module';
import { UsageBillingModule } from './modules/usage-billing/usage-billing.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { SupportModule } from './modules/support/support.module';
import { SearchModule } from './modules/search/search.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
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
import { IndustryModule } from './modules/industry/industry.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TryOnModule } from './modules/try-on/try-on.module';
import { ExperimentsModule } from './modules/experiments/experiments.module';
import { Configurator3DModule } from './modules/configurator-3d/configurator-3d.module';
import { VisualCustomizerModule } from './modules/visual-customizer/visual-customizer.module';
import { AssetHubModule } from './modules/asset-hub/asset-hub.module';
import { PrintOnDemandModule } from './modules/print-on-demand/print-on-demand.module';

// Integration modules (e-commerce - also used by IntegrationsModule)
import { PrestaShopModule } from './modules/integrations/prestashop/prestashop.module';
import { WooCommerceModule } from './modules/integrations/woocommerce/woocommerce.module';
import { ShopifyModule } from './modules/integrations/shopify/shopify.module';

// Public API modules (also used by PublicApiModule)
import { RateLimitModule as PublicApiRateLimitModule } from './modules/public-api/rate-limit/rate-limit.module';
import { WebhooksModule as PublicApiWebhooksModule } from './modules/public-api/webhooks/webhooks.module';
import { OAuthModule as PublicApiOAuthModule } from './modules/public-api/oauth/oauth.module';
import { ApiKeysModule } from './modules/public-api/api-keys/api-keys.module';
import { AnalyticsModule as PublicApiAnalyticsModule } from './modules/public-api/analytics/analytics.module';

// Note: Agent submodules (AIMonitor, UsageGuardian, Aria, Luna, Nova) are imported
// via AgentsModule, no need to import them separately here.

// Additional modules
import { AnalyticsAdvancedModule } from './modules/analytics/analytics-advanced.module';
import { RbacModule } from './modules/security/rbac.module';
import { GrafanaModule } from './modules/monitoring/grafana/grafana.module';

// Common
import { CommonModule } from './common/common.module';
import { TIMEOUTS } from './common/constants/app.constants';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// i18n & Timezone
import { I18nModule } from './libs/i18n/i18n.module';
import { TimezoneModule } from './libs/timezone/timezone.module';

// Jobs
import { JobsModule } from './jobs/jobs.module';
import { CacheableInterceptor } from './libs/cache/cacheable.interceptor';
import { CacheControlInterceptor } from './common/interceptors/cache-control.interceptor';

// WebSocket
import { WebSocketModule } from './websocket/websocket.module';

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

// Resilience
import { ResilienceModule } from './libs/resilience/resilience.module';

// Crypto (AES-256-GCM encryption)
import { CryptoModule } from './libs/crypto/crypto.module';

// PRODUCTION FIX: Redis-backed ThrottlerStorage for multi-instance
import { ThrottlerRedisStorageService } from './libs/rate-limit/throttler-redis-storage.service';
import { RedisOptimizedService } from './libs/redis/redis-optimized.service';

@Module({
  imports: [
    // Sentry for error monitoring
    SentryModule.forRoot(),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
        // PRODUCTION FIX: These configs were defined but never loaded
        marketplaceConfig,
        referralConfig,
        printfulConfig,
        printifyConfig,
        gelatoConfig,
      ],
      validate: validateConfig,
      cache: true,
    }),

    // PRODUCTION FIX: Rate limiting with Redis-backed storage for multi-instance deployments
    // Falls back to in-memory if Redis is unavailable
    // RATE LIMIT FIX: Webhook paths skipped in GlobalRateLimitGuard: billing/webhook,
    // ecommerce/woocommerce/webhook, integrations/shopify/webhooks (P3-12)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService, redisService: RedisOptimizedService) => ({
        throttlers: [{
          ttl: (configService.get('app.rateLimitTtl') ?? 60) * 1000,
          limit: configService.get<number>('app.rateLimitLimit') ?? 100,
        }],
        storage: new ThrottlerRedisStorageService(redisService),
      }),
      inject: [ConfigService, RedisOptimizedService],
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
        // En mode test, on désactive BullMQ pour éviter les connexions Redis
        const isTest = process.env.NODE_ENV === 'test' || process.env.DISABLE_BULL === 'true';
        
        if (isTest) {
          // Configuration qui utilise Redis local (qui doit être disponible)
          return {
            redis: process.env.REDIS_URL || 'redis://localhost:6379',
            defaultJobOptions: {
              removeOnComplete: true,
              removeOnFail: true,
              attempts: 1, // Un seul essai en test
            },
          };
        }
        
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
          connectTimeout: TIMEOUTS.REDIS_CONNECT,
          commandTimeout: TIMEOUTS.REDIS_COMMAND,
        } : redisUrl) : undefined;

        return {
          redis: redisConfig || redisUrl,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: TIMEOUTS.RETRY_DELAY,
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
    CartModule,
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
        PricingModule, // ✅ PHASE 6 - Pricing & Rentabilité IA
        ProductEngineModule,
    // PRODUCTION FIX: RenderModule requires native canvas/sharp deps (available in Docker)
    // Conditionally loaded to avoid failures in dev environments without native deps
    ...(process.env.ENABLE_RENDER_MODULE === 'true' || process.env.NODE_ENV === 'production' ? [RenderModule] : []),
    EcommerceModule,
    UsageBillingModule,
    WidgetModule,
    GenerationModule,
    SecurityModule,
    SettingsModule,
    AnalyticsModule,
    AnalyticsCleanModule, // Clean minimal analytics
    ArStudioModule,
    MarketplaceModule,
    EnterpriseModule,
    ObservabilityModule,
    OrionModule,
    TrustSafetyModule,
    CreditsModule,
    MonitoringModule,
    SupportModule,
    SearchModule,
    NotificationsModule,
    CollectionsModule,
    TeamModule,
    FavoritesModule,
    ClipartsModule,
    ReferralModule,
    CronJobsModule,
    CustomizationModule,
    BraceletModule,
    IndustryModule,
    OnboardingModule,
    DashboardModule,
    CollaborationModule,
    FeatureFlagsModule,
    ProjectsModule,
    TryOnModule,
    ExperimentsModule,
    Configurator3DModule,
    VisualCustomizerModule,
    AssetHubModule,
    PrintOnDemandModule,
    EditorModule,

    // Integration modules (e-commerce)
    PrestaShopModule,
    WooCommerceModule,
    ShopifyModule,

    // Public API modules
    PublicApiRateLimitModule,
    PublicApiWebhooksModule,
    PublicApiOAuthModule,
    ApiKeysModule,
    PublicApiAnalyticsModule,

    // Agent modules - DISABLED: excluded from tsconfig.build.json
    // AIMonitorModule,
    // UsageGuardianModule,
    // AriaModule,
    // LunaModule,
    // NovaModule,

    // Additional modules
    AnalyticsAdvancedModule,
    RbacModule,
    GrafanaModule,

    // Cache Module (Global)
    CacheModule,

    // Audit logging
    AuditModule,

    // Common utilities
    CommonModule,

    // Resilience (Circuit Breaker, Retry)
    ResilienceModule,

    // Crypto (AES-256-GCM encryption for sensitive data)
    CryptoModule,

    // i18n & Timezone for global platform
    I18nModule,
    TimezoneModule,

    // PRODUCTION FIX: Re-enabled JobsModule for Railway deployment (long-lived process with Redis)
    // Guarded by VERCEL env var (disabled on Vercel) and DISABLE_BULL (explicit opt-out)
    ...(process.env.VERCEL || process.env.DISABLE_BULL === 'true' ? [] : [JobsModule]),

    // PRODUCTION FIX: Re-enabled WebSocketModule for Railway deployment (supports persistent connections)
    // Disabled on Vercel (serverless) and in test environment
    ...(process.env.VERCEL || process.env.NODE_ENV === 'test' ? [] : [WebSocketModule]),

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
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheableInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheControlInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalRateLimitGuard,
    },
  ],
})
export class AppModule {}