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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageMeteringService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = __importDefault(require("stripe"));
/**
 * Service de métering d'usage avec Stripe
 * Enregistre et synchronise l'utilisation avec Stripe pour la facturation
 */
let UsageMeteringService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsageMeteringService = _classThis = class {
        constructor(prisma, cache, usageQueue) {
            this.prisma = prisma;
            this.cache = cache;
            this.usageQueue = usageQueue;
            this.logger = new common_1.Logger(UsageMeteringService.name);
            this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
                apiVersion: '2023-10-16',
            });
        }
        /**
         * Enregistrer une métrique d'usage
         */
        async recordUsage(brandId, metric, value = 1, metadata) {
            try {
                // Créer l'enregistrement d'usage
                const usageMetric = {
                    id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    brandId,
                    metric,
                    value,
                    unit: this.getUnitForMetric(metric),
                    timestamp: new Date(),
                    metadata,
                };
                // Sauvegarder en DB (via queue pour async)
                await this.usageQueue.add('record-usage', {
                    usageMetric,
                });
                // Envoyer à Stripe si applicable
                await this.reportToStripe(brandId, metric, value);
                // Invalidate cache
                await this.cache.delSimple(`usage:${brandId}:current`);
                this.logger.log(`Usage recorded: ${metric} = ${value} for brand ${brandId}`);
                return usageMetric;
            }
            catch (error) {
                this.logger.error(`Failed to record usage: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Rapporter l'usage à Stripe
         */
        async reportToStripe(brandId, metric, quantity) {
            try {
                // Récupérer la subscription Stripe du brand
                const subscription = await this.getStripeSubscription(brandId);
                if (!subscription) {
                    this.logger.warn(`No Stripe subscription found for brand ${brandId}`);
                    return;
                }
                // Trouver le subscription item correspondant à cette métrique
                const subscriptionItem = this.findSubscriptionItemForMetric(subscription, metric);
                if (!subscriptionItem) {
                    this.logger.warn(`No subscription item for metric ${metric} on brand ${brandId}`);
                    return;
                }
                // Créer un usage record dans Stripe
                const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(subscriptionItem.id, {
                    quantity: Math.ceil(quantity), // Stripe nécessite un entier
                    timestamp: Math.floor(Date.now() / 1000),
                    action: 'increment', // ou 'set' selon le cas
                });
                this.logger.debug(`Stripe usage record created: ${usageRecord.id} for ${metric}`);
            }
            catch (error) {
                this.logger.error(`Failed to report to Stripe: ${error.message}`, error.stack);
                // Ne pas throw pour ne pas bloquer l'enregistrement local
            }
        }
        /**
         * Récupérer la subscription Stripe d'un brand
         */
        async getStripeSubscription(brandId) {
            try {
                // @ts-ignore - stripeSubscriptionId exists in schema but Prisma client may need regeneration
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: { stripeSubscriptionId: true },
                });
                // @ts-ignore - stripeSubscriptionId exists in schema but Prisma client may need regeneration
                if (!brand?.stripeSubscriptionId) {
                    return null;
                }
                // @ts-ignore - stripeSubscriptionId exists in schema but Prisma client may need regeneration
                const subscription = await this.stripe.subscriptions.retrieve(brand.stripeSubscriptionId, {
                    expand: ['items.data.price.product'],
                });
                return subscription;
            }
            catch (error) {
                this.logger.error(`Failed to get Stripe subscription: ${error.message}`, error.stack);
                return null;
            }
        }
        /**
         * Trouver le subscription item pour une métrique
         */
        findSubscriptionItemForMetric(subscription, metric) {
            if (!subscription?.items?.data) {
                return null;
            }
            // Mapping entre nos métriques et les products Stripe
            const metricToStripeProductMap = {
                designs_created: 'prod_designs',
                renders_2d: 'prod_renders_2d',
                renders_3d: 'prod_renders_3d',
                exports_gltf: 'prod_exports',
                exports_usdz: 'prod_exports',
                ai_generations: 'prod_ai',
                storage_gb: 'prod_storage',
                bandwidth_gb: 'prod_bandwidth',
                api_calls: 'prod_api',
                webhook_deliveries: 'prod_webhooks',
                custom_domains: 'prod_domains',
                team_members: 'prod_team',
            };
            const targetProductId = metricToStripeProductMap[metric];
            for (const item of subscription.items.data) {
                const productId = item.price?.product?.id || item.price?.product;
                if (productId === targetProductId) {
                    return item;
                }
            }
            return null;
        }
        /**
         * Obtenir l'unité pour une métrique
         */
        getUnitForMetric(metric) {
            const units = {
                designs_created: 'designs',
                renders_2d: 'renders',
                renders_3d: 'renders',
                exports_gltf: 'exports',
                exports_usdz: 'exports',
                ai_generations: 'generations',
                storage_gb: 'GB',
                bandwidth_gb: 'GB',
                api_calls: 'calls',
                webhook_deliveries: 'webhooks',
                custom_domains: 'domains',
                team_members: 'members',
            };
            return units[metric] || 'units';
        }
        /**
         * Récupérer l'usage actuel d'un brand
         */
        async getCurrentUsage(brandId) {
            try {
                // Check cache
                const cached = await this.cache.get(`usage:${brandId}:current`, null, null);
                if (cached) {
                    return JSON.parse(cached);
                }
                // Récupérer depuis DB pour le mois en cours
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);
                // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                const usageRecords = await this.prisma.usageMetric.findMany({
                    where: {
                        brandId,
                        timestamp: {
                            gte: startOfMonth,
                        },
                    },
                });
                // Agréger par métrique
                const usage = {};
                for (const record of usageRecords) {
                    usage[record.metric] = (usage[record.metric] || 0) + record.value;
                }
                // Cache pour 5 minutes
                await this.cache.set(`usage:${brandId}:current`, JSON.stringify(usage), 300);
                return usage;
            }
            catch (error) {
                this.logger.error(`Failed to get current usage: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Récupérer l'usage Stripe directement (source de vérité)
         */
        async getStripeUsage(brandId, metric, startDate, endDate) {
            try {
                const subscription = await this.getStripeSubscription(brandId);
                if (!subscription) {
                    return 0;
                }
                const subscriptionItem = this.findSubscriptionItemForMetric(subscription, metric);
                if (!subscriptionItem) {
                    return 0;
                }
                // Récupérer les usage records de Stripe
                const usageRecords = await this.stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItem.id, {
                    limit: 100,
                });
                // Sommer les quantités dans la période
                let total = 0;
                for (const record of usageRecords.data) {
                    const recordDate = new Date(record.period.start * 1000);
                    if (recordDate >= startDate && recordDate <= endDate) {
                        total += record.total_usage;
                    }
                }
                return total;
            }
            catch (error) {
                this.logger.error(`Failed to get Stripe usage: ${error.message}`, error.stack);
                return 0;
            }
        }
        /**
         * Batch reporting pour optimisation
         */
        async batchRecordUsage(brandId, metrics) {
            try {
                const promises = metrics.map((m) => this.recordUsage(brandId, m.metric, m.value));
                await Promise.all(promises);
                this.logger.log(`Batch recorded ${metrics.length} usage metrics for brand ${brandId}`);
            }
            catch (error) {
                this.logger.error(`Failed to batch record usage: ${error.message}`, error.stack);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "UsageMeteringService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsageMeteringService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsageMeteringService = _classThis;
})();
exports.UsageMeteringService = UsageMeteringService;
