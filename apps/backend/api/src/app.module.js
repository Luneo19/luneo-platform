"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const terminus_1 = require("@nestjs/terminus");
const bull_1 = require("@nestjs/bull");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const setup_1 = require("@sentry/nestjs/setup");
const core_1 = require("@nestjs/core");
const setup_2 = require("@sentry/nestjs/setup");
// Configuration
const configuration_1 = require("./config/configuration");
// Modules
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const brands_module_1 = require("./modules/brands/brands.module");
const products_module_1 = require("./modules/products/products.module");
const designs_module_1 = require("./modules/designs/designs.module");
const orders_module_1 = require("./modules/orders/orders.module");
const ai_module_1 = require("./modules/ai/ai.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const admin_module_1 = require("./modules/admin/admin.module");
const health_module_1 = require("./modules/health/health.module");
const email_module_1 = require("./modules/email/email.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const public_api_module_1 = require("./modules/public-api/public-api.module");
const billing_module_1 = require("./modules/billing/billing.module");
const plans_module_1 = require("./modules/plans/plans.module");
const product_engine_module_1 = require("./modules/product-engine/product-engine.module");
const render_module_1 = require("./modules/render/render.module");
const ecommerce_module_1 = require("./modules/ecommerce/ecommerce.module");
const usage_billing_module_1 = require("./modules/usage-billing/usage-billing.module");
const security_module_1 = require("./modules/security/security.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const marketplace_module_1 = require("./modules/marketplace/marketplace.module");
const observability_module_1 = require("./modules/observability/observability.module");
const trust_safety_module_1 = require("./modules/trust-safety/trust-safety.module");
// Common
const common_module_1 = require("./common/common.module");
// i18n & Timezone
const i18n_module_1 = require("./libs/i18n/i18n.module");
const timezone_module_1 = require("./libs/timezone/timezone.module");
// Jobs
const jobs_module_1 = require("./jobs/jobs.module");
const cacheable_interceptor_1 = require("./libs/cache/cacheable.interceptor");
// Outbox & Budgets
const outbox_module_1 = require("./libs/outbox/outbox.module");
const budget_module_1 = require("./libs/budgets/budget.module");
const dlq_module_1 = require("./jobs/dlq/dlq.module");
// Metrics
const metrics_module_1 = require("./libs/metrics/metrics.module");
// Tracing
const tracing_module_1 = require("./libs/tracing/tracing.module");
let AppModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                // Sentry for error monitoring
                setup_1.SentryModule.forRoot(),
                // Configuration
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        configuration_1.databaseConfig,
                        configuration_1.redisConfig,
                        configuration_1.jwtConfig,
                        configuration_1.oauthConfig,
                        configuration_1.stripeConfig,
                        configuration_1.cloudinaryConfig,
                        configuration_1.aiConfig,
                        configuration_1.emailConfig,
                        configuration_1.emailDomainConfig,
                        configuration_1.appConfig,
                        configuration_1.monitoringConfig,
                    ],
                    cache: true,
                }),
                // Rate limiting
                throttler_1.ThrottlerModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        throttlers: [{
                                ttl: configService.get('app.rateLimitTtl') * 1000,
                                limit: configService.get('app.rateLimitLimit'),
                            }],
                    }),
                    inject: [config_1.ConfigService],
                }),
                // Health checks
                terminus_1.TerminusModule,
                // Event emitter
                event_emitter_1.EventEmitterModule.forRoot(),
                // Scheduled tasks (désactivé en serverless pour Vercel)
                ...(process.env.VERCEL ? [] : [schedule_1.ScheduleModule.forRoot()]),
                // BullMQ for job queues (optimisé pour serverless)
                bull_1.BullModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        redis: configService.get('redis.url'),
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
                    }),
                    inject: [config_1.ConfigService],
                }),
                // Application modules
                auth_module_1.AuthModule,
                users_module_1.UsersModule,
                brands_module_1.BrandsModule,
                products_module_1.ProductsModule,
                designs_module_1.DesignsModule,
                orders_module_1.OrdersModule,
                ai_module_1.AiModule,
                webhooks_module_1.WebhooksModule,
                admin_module_1.AdminModule,
                health_module_1.HealthModule,
                email_module_1.EmailModule,
                integrations_module_1.IntegrationsModule,
                public_api_module_1.PublicApiModule,
                billing_module_1.BillingModule,
                plans_module_1.PlansModule,
                product_engine_module_1.ProductEngineModule,
                render_module_1.RenderModule,
                ecommerce_module_1.EcommerceModule,
                usage_billing_module_1.UsageBillingModule,
                security_module_1.SecurityModule,
                analytics_module_1.AnalyticsModule,
                marketplace_module_1.MarketplaceModule,
                observability_module_1.ObservabilityModule,
                trust_safety_module_1.TrustSafetyModule,
                // Common utilities
                common_module_1.CommonModule,
                // i18n & Timezone for global platform
                i18n_module_1.I18nModule,
                timezone_module_1.TimezoneModule,
                // Job processing (conditionnel pour serverless)
                ...(process.env.VERCEL ? [] : [jobs_module_1.JobsModule]),
                // WebSocket for real-time collaboration (temporairement désactivé pour build)
                // WebSocketModule,
                // Outbox & Budgets
                outbox_module_1.OutboxModule,
                budget_module_1.BudgetModule,
                dlq_module_1.DLQModule,
                // Metrics
                metrics_module_1.MetricsModule,
                // Tracing
                tracing_module_1.TracingModule,
            ],
            controllers: [],
            providers: [
                {
                    provide: core_1.APP_FILTER,
                    useClass: setup_2.SentryGlobalFilter,
                },
                {
                    provide: core_1.APP_INTERCEPTOR,
                    useClass: cacheable_interceptor_1.CacheableInterceptor,
                },
            ],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AppModule = _classThis = class {
    };
    __setFunctionName(_classThis, "AppModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
})();
exports.AppModule = AppModule;
