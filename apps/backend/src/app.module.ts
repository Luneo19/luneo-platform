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
// MODULES CORE FONCTIONNELS
// =============================================
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SecurityModule } from './modules/security/security.module';
import { RbacModule } from './modules/security/rbac.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { BillingModule } from './modules/billing/billing.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { CreditsModule } from './modules/credits/credits.module';
import { AdminModule } from './modules/admin/admin.module';
import { CacheModule } from './modules/cache/cache.module';

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
import { QuotasModule } from './modules/quotas/quotas.module';
import { AnalyticsCleanModule } from './modules/analytics-clean/analytics-clean.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebCrawlerModule } from './modules/web-crawler/web-crawler.module';
import { EvalHarnessModule } from './modules/eval-harness/eval-harness.module';
import { UsageBillingModule } from './modules/usage-billing/usage-billing.module';
import { ContactModule } from './modules/contact/contact.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { VerticalsModule } from './modules/verticals/verticals.module';
import { LearningModule } from './modules/learning/learning.module';
import { RoiModule } from './modules/roi/roi.module';
import { MemoryModule } from './modules/memory/memory.module';
import { ActionsModule } from './modules/actions/actions.module';
import { AutomationModule } from './modules/automation/automation.module';
import { IntegrationsApiModule } from './modules/integrations-api/integrations-api.module';
import { SearchModule } from './modules/search/search.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { StatusPageModule } from './modules/status-page/status-page.module';
import { ScheduledMessagesModule } from './modules/scheduled-messages/scheduled-messages.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';

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

        const redisConf = redisUrl
          ? (isUpstash
              ? {
                  host: redisUrl.split('@')[1]?.split(':')[0] || 'localhost',
                  port: 6379,
                  password: redisUrl.split('default:')[1]?.split('@')[0] || undefined,
                  tls: { rejectUnauthorized: true },
                  maxRetriesPerRequest: 3,
                  enableReadyCheck: false,
                  lazyConnect: true,
                  connectTimeout: TIMEOUTS.REDIS_CONNECT,
                  commandTimeout: TIMEOUTS.REDIS_COMMAND,
                }
              : redisUrl)
          : undefined;

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

    // --- Core modules ---
    AuthModule,
    UsersModule,
    SecurityModule,
    RbacModule,
    SettingsModule,
    AuditModule,
    HealthModule,
    EmailModule,
    FeatureFlagsModule,
    BillingModule,
    PricingModule,
    CreditsModule,
    AdminModule,
    CacheModule,

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
    QuotasModule,
    AnalyticsCleanModule,
    OnboardingModule,
    NotificationsModule,
    WebCrawlerModule,
    EvalHarnessModule,
    UsageBillingModule,
    ContactModule,
    ContactsModule,
    VerticalsModule,
    LearningModule,
    RoiModule,
    MemoryModule,
    ActionsModule,
    AutomationModule,
    IntegrationsApiModule,
    SearchModule,
    PublicApiModule,
    PrivacyModule,
    WebhooksModule,
    StatusPageModule,
    ScheduledMessagesModule,
    EnterpriseModule,

    // --- Infrastructure ---
    CommonModule,
    ResilienceModule,
    CryptoModule,
    I18nModule,
    TimezoneModule,
    TracingModule,

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
