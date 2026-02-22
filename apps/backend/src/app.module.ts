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
    validateConfig,
} from './config/configuration';

// =============================================
// MODULES GARDES TEL QUEL (16 modules core)
// =============================================
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SecurityModule } from './modules/security/security.module';
import { RbacModule } from './modules/security/rbac.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TeamModule } from './modules/team/team.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { CronJobsModule } from './modules/cron-jobs/cron-jobs.module';
import { SearchModule } from './modules/search/search.module';
import { SupportModule } from './modules/support/support.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

// =============================================
// MODULES A ADAPTER (10 modules)
// =============================================
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { BillingModule } from './modules/billing/billing.module';
import { PlansModule } from './modules/plans/plans.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { CreditsModule } from './modules/credits/credits.module';
import { UsageBillingModule } from './modules/usage-billing/usage-billing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnalyticsCleanModule } from './modules/analytics/analytics-clean.module';
import { AnalyticsAdvancedModule } from './modules/analytics/analytics-advanced.module';
import { AdminModule } from './modules/admin/admin.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

// Public API sub-modules
import { RateLimitModule as PublicApiRateLimitModule } from './modules/public-api/rate-limit/rate-limit.module';
import { WebhooksModule as PublicApiWebhooksModule } from './modules/public-api/webhooks/webhooks.module';
import { OAuthModule as PublicApiOAuthModule } from './modules/public-api/oauth/oauth.module';
import { ApiKeysModule } from './modules/public-api/api-keys/api-keys.module';
import { AnalyticsModule as PublicApiAnalyticsModule } from './modules/public-api/analytics/analytics.module';

// Integration sub-modules (kept for V2 connectors)
import { ShopifyModule } from './modules/integrations/shopify/shopify.module';

import { OrganizationsModule } from './modules/organizations/organizations.module';

// =============================================
// NOUVEAUX MODULES V2 (Agents IA)
// =============================================
import { AgentsModule } from './modules/agents/agents.module';
import { AgentTemplatesModule } from './modules/agent-templates/agent-templates.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { RagModule } from './modules/rag/rag.module';
import { LlmWrapperModule } from './modules/llm/llm.module';
import { WidgetApiModule } from './modules/widget-api/widget-api.module';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module';
import { AgentAnalyticsModule } from './modules/agent-analytics/agent-analytics.module';

// =============================================
// MODULES SUPPLEMENTAIRES GARDES
// =============================================
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { ObservabilityModule } from './modules/observability/observability.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { GrafanaModule } from './modules/monitoring/grafana/grafana.module';
import { CacheModule } from './modules/cache/cache.module';

// =============================================
// LIBS INFRASTRUCTURE
// =============================================
import { CommonModule } from './common/common.module';
import { TIMEOUTS } from './common/constants/app.constants';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CacheableInterceptor } from './libs/cache/cacheable.interceptor';
import { CacheControlInterceptor } from './common/interceptors/cache-control.interceptor';
import { GlobalRateLimitGuard } from './common/guards/global-rate-limit.guard';

import { I18nModule } from './libs/i18n/i18n.module';
import { TimezoneModule } from './libs/timezone/timezone.module';
import { JobsModule } from './jobs/jobs.module';
import { WebSocketModule } from './websocket/websocket.module';
import { DLQModule } from './jobs/dlq/dlq.module';
import { BudgetModule } from './libs/budgets/budget.module';
import { OutboxModule } from './libs/outbox/outbox.module';
import { MetricsModule } from './libs/metrics/metrics.module';
import { TracingModule } from './libs/tracing/tracing.module';
import { ResilienceModule } from './libs/resilience/resilience.module';
import { CryptoModule } from './libs/crypto/crypto.module';
import { ThrottlerRedisStorageService } from './libs/rate-limit/throttler-redis-storage.service';
import { RedisOptimizedService } from './libs/redis/redis-optimized.service';

@Module({
  imports: [
    SentryModule.forRoot(),

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
      ],
      validate: validateConfig,
      cache: true,
    }),

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

    TerminusModule,
    EventEmitterModule.forRoot(),
    ...(process.env.VERCEL ? [] : [ScheduleModule.forRoot()]),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test' || process.env.DISABLE_BULL === 'true';
        
        if (isTest) {
          return {
            redis: process.env.REDIS_URL || 'redis://localhost:6379',
            defaultJobOptions: {
              removeOnComplete: true,
              removeOnFail: true,
              attempts: 1,
            },
          };
        }
        
        const redisUrl = configService.get('redis.url');
        const isUpstash = redisUrl?.includes('upstash.io') || redisUrl?.startsWith('rediss://');
        
        const redisConf = redisUrl ? (isUpstash ? {
          host: redisUrl.split('@')[1]?.split(':')[0] || 'localhost',
          port: 6379,
          password: redisUrl.split('default:')[1]?.split('@')[0] || undefined,
          tls: { rejectUnauthorized: true },
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
          connectTimeout: TIMEOUTS.REDIS_CONNECT,
          commandTimeout: TIMEOUTS.REDIS_COMMAND,
        } : redisUrl) : undefined;

        return {
          redis: redisConf || redisUrl,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: { type: 'exponential', delay: TIMEOUTS.RETRY_DELAY },
          },
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

    // --- Core modules (kept as-is) ---
    AuthModule,
    UsersModule,
    SecurityModule,
    RbacModule,
    SettingsModule,
    TeamModule,
    NotificationsModule,
    AuditModule,
    HealthModule,
    EmailModule,
    FeatureFlagsModule,
    CronJobsModule,
    SearchModule,
    SupportModule,
    WebhooksModule,

    // --- Modules to adapt for V2 ---
    OnboardingModule,
    BillingModule,
    PlansModule,
    PricingModule,
    CreditsModule,
    UsageBillingModule,
    // AnalyticsModule, // V1 analytics (ML predictions, complex deps) - disabled
    AnalyticsCleanModule,
    // AnalyticsAdvancedModule, // V1 advanced analytics - disabled
    AdminModule,
    PublicApiModule,
    IntegrationsModule,

    // Public API sub-modules
    PublicApiRateLimitModule,
    PublicApiWebhooksModule,
    PublicApiOAuthModule,
    ApiKeysModule,
    PublicApiAnalyticsModule,

    // Integration sub-modules
    ShopifyModule,

    // --- Organizations (renamed from brands) ---
    OrganizationsModule,

    // --- V2 Agent IA modules ---
    AgentsModule,
    AgentTemplatesModule,
    ConversationsModule,
    ChannelsModule,
    KnowledgeModule,
    RagModule,
    LlmWrapperModule,
    WidgetApiModule,
    OrchestratorModule,
    AgentAnalyticsModule,

    // --- Supplementary modules ---
    EnterpriseModule,
    ObservabilityModule,
    MonitoringModule,
    GrafanaModule,
    CacheModule,

    // --- Infrastructure ---
    CommonModule,
    ResilienceModule,
    CryptoModule,
    I18nModule,
    TimezoneModule,
    OutboxModule,
    BudgetModule,
    DLQModule,
    MetricsModule,
    TracingModule,

    // Jobs & WebSocket (disabled on Vercel / in tests)
    // JobsModule disabled — V1 workers (design, render, production) archived
    // V2 queue processing handled by knowledge-indexing processor in KnowledgeModule
    // ...(process.env.VERCEL || process.env.DISABLE_BULL === 'true' ? [] : [JobsModule]),
    // WebSocket disabled for initial V2 startup — re-enable when needed
    // ...(process.env.VERCEL || process.env.NODE_ENV === 'test' ? [] : [WebSocketModule]),
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheableInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheControlInterceptor },
    { provide: APP_GUARD, useClass: GlobalRateLimitGuard },
  ],
})
export class AppModule {}
