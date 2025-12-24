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
exports.QuotasService = void 0;
const common_1 = require("@nestjs/common");
/**
 * Service de gestion des quotas
 * Vérifie les limites par plan et gère les overages
 */
let QuotasService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var QuotasService = _classThis = class {
        constructor(prisma, cache, meteringService) {
            this.prisma = prisma;
            this.cache = cache;
            this.meteringService = meteringService;
            this.logger = new common_1.Logger(QuotasService.name);
            // Définition des plans et leurs limites
            this.planLimits = {
                starter: {
                    plan: 'starter',
                    basePrice: 2900, // 29€ / mois
                    quotas: [
                        {
                            metric: 'designs_created',
                            limit: 50,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 50, // 0.50€ par design supplémentaire
                        },
                        {
                            metric: 'renders_2d',
                            limit: 100,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 20, // 0.20€ par rendu
                        },
                        {
                            metric: 'renders_3d',
                            limit: 10,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 100, // 1€ par rendu 3D
                        },
                        {
                            metric: 'ai_generations',
                            limit: 20,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 75, // 0.75€ par génération IA
                        },
                        {
                            metric: 'storage_gb',
                            limit: 5,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 50, // 0.50€ par GB
                        },
                        {
                            metric: 'api_calls',
                            limit: 10000,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 1, // 0.01€ par 100 appels
                        },
                        {
                            metric: 'team_members',
                            limit: 2,
                            period: 'month',
                            overage: 'block',
                        },
                    ],
                    features: ['Basic support', 'Email notifications', '2 team members'],
                },
                professional: {
                    plan: 'professional',
                    basePrice: 9900, // 99€ / mois
                    quotas: [
                        {
                            metric: 'designs_created',
                            limit: 200,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 40, // 0.40€
                        },
                        {
                            metric: 'renders_2d',
                            limit: 500,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 15, // 0.15€
                        },
                        {
                            metric: 'renders_3d',
                            limit: 50,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 80, // 0.80€
                        },
                        {
                            metric: 'ai_generations',
                            limit: 100,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 60, // 0.60€
                        },
                        {
                            metric: 'storage_gb',
                            limit: 25,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 40, // 0.40€ par GB
                        },
                        {
                            metric: 'api_calls',
                            limit: 50000,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 1,
                        },
                        {
                            metric: 'team_members',
                            limit: 10,
                            period: 'month',
                            overage: 'block',
                        },
                    ],
                    features: [
                        'Priority support',
                        'Advanced analytics',
                        '10 team members',
                        'Custom branding',
                    ],
                },
                business: {
                    plan: 'business',
                    basePrice: 29900, // 299€ / mois
                    quotas: [
                        {
                            metric: 'designs_created',
                            limit: 1000,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 30, // 0.30€
                        },
                        {
                            metric: 'renders_2d',
                            limit: 2000,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 10, // 0.10€
                        },
                        {
                            metric: 'renders_3d',
                            limit: 200,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 60, // 0.60€
                        },
                        {
                            metric: 'ai_generations',
                            limit: 500,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 50, // 0.50€
                        },
                        {
                            metric: 'storage_gb',
                            limit: 100,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 30, // 0.30€ par GB
                        },
                        {
                            metric: 'api_calls',
                            limit: 200000,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 1,
                        },
                        {
                            metric: 'team_members',
                            limit: 50,
                            period: 'month',
                            overage: 'block',
                        },
                    ],
                    features: [
                        'Dedicated support',
                        'Advanced analytics',
                        '50 team members',
                        'Custom branding',
                        'API access',
                        'Webhooks',
                    ],
                },
                enterprise: {
                    plan: 'enterprise',
                    basePrice: 99900, // 999€ / mois
                    quotas: [
                        {
                            metric: 'designs_created',
                            limit: 99999,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 20, // 0.20€
                        },
                        {
                            metric: 'renders_2d',
                            limit: 99999,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 5, // 0.05€
                        },
                        {
                            metric: 'renders_3d',
                            limit: 99999,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 40, // 0.40€
                        },
                        {
                            metric: 'ai_generations',
                            limit: 99999,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 40, // 0.40€
                        },
                        {
                            metric: 'storage_gb',
                            limit: 500,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 20, // 0.20€ par GB
                        },
                        {
                            metric: 'api_calls',
                            limit: 9999999,
                            period: 'month',
                            overage: 'charge',
                            overageRate: 1,
                        },
                        {
                            metric: 'team_members',
                            limit: 999,
                            period: 'month',
                            overage: 'block',
                        },
                    ],
                    features: [
                        'White glove support',
                        'Custom analytics',
                        'Unlimited team members',
                        'Full customization',
                        'API access',
                        'Webhooks',
                        'SLA 99.9%',
                        'Dedicated infrastructure',
                    ],
                },
            };
        }
        /**
         * Vérifier si un brand peut utiliser une métrique
         */
        async checkQuota(brandId, metric, requestedAmount = 1) {
            try {
                // Récupérer le plan du brand
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: { plan: true },
                });
                if (!brand) {
                    throw new common_1.BadRequestException('Brand not found');
                }
                const planLimits = this.planLimits[brand.plan || 'starter'];
                const quota = planLimits.quotas.find((q) => q.metric === metric);
                if (!quota) {
                    // Pas de quota défini pour cette métrique = illimité
                    return {
                        allowed: true,
                        remaining: 999999,
                        limit: 999999,
                        overage: 0,
                        willCharge: false,
                        estimatedCost: 0,
                    };
                }
                // Récupérer l'usage actuel
                const currentUsage = await this.meteringService.getCurrentUsage(brandId);
                const used = currentUsage[metric] || 0;
                const remaining = Math.max(0, quota.limit - used);
                const overage = Math.max(0, used + requestedAmount - quota.limit);
                // Vérifier si l'action est autorisée
                let allowed = true;
                let estimatedCost = 0;
                if (overage > 0) {
                    if (quota.overage === 'block') {
                        allowed = false;
                    }
                    else if (quota.overage === 'charge') {
                        allowed = true;
                        estimatedCost = overage * (quota.overageRate || 0);
                    }
                }
                return {
                    allowed,
                    remaining,
                    limit: quota.limit,
                    overage,
                    willCharge: quota.overage === 'charge' && overage > 0,
                    estimatedCost,
                };
            }
            catch (error) {
                this.logger.error(`Failed to check quota: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Vérifier et appliquer le quota (throw si dépassé et bloqué)
         */
        async enforceQuota(brandId, metric, amount = 1) {
            const check = await this.checkQuota(brandId, metric, amount);
            if (!check.allowed) {
                throw new common_1.BadRequestException(`Quota exceeded for ${metric}. Limit: ${check.limit}, Used: ${check.limit - check.remaining}. Please upgrade your plan.`);
            }
            if (check.willCharge && check.estimatedCost > 0) {
                this.logger.warn(`Brand ${brandId} will be charged ${check.estimatedCost} cents for ${metric} overage`);
            }
        }
        /**
         * Récupérer le résumé d'usage complet
         */
        async getUsageSummary(brandId) {
            try {
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: { plan: true },
                });
                if (!brand) {
                    throw new common_1.BadRequestException('Brand not found');
                }
                const planLimits = this.planLimits[brand.plan || 'starter'];
                const currentUsage = await this.meteringService.getCurrentUsage(brandId);
                // Calculer les métriques avec pourcentages
                const metrics = planLimits.quotas.map((quota) => {
                    const current = currentUsage[quota.metric] || 0;
                    const percentage = (current / quota.limit) * 100;
                    const overage = Math.max(0, current - quota.limit);
                    return {
                        type: quota.metric,
                        current,
                        limit: quota.limit,
                        percentage: Math.min(100, percentage),
                        overage,
                    };
                });
                // Calculer les coûts estimés
                let usageCost = 0;
                let overageCost = 0;
                for (const metric of metrics) {
                    const quota = planLimits.quotas.find((q) => q.metric === metric.type);
                    if (quota && metric.overage > 0 && quota.overageRate) {
                        overageCost += metric.overage * quota.overageRate;
                    }
                }
                const estimatedCost = {
                    base: planLimits.basePrice,
                    usage: usageCost,
                    overage: overageCost,
                    total: planLimits.basePrice + usageCost + overageCost,
                };
                // Générer des alertes
                const alerts = [];
                for (const metric of metrics) {
                    if (metric.percentage >= 90) {
                        alerts.push({
                            severity: 'critical',
                            message: `${metric.type} at ${metric.percentage.toFixed(0)}% of quota`,
                            metric: metric.type,
                            threshold: 90,
                        });
                    }
                    else if (metric.percentage >= 75) {
                        alerts.push({
                            severity: 'warning',
                            message: `${metric.type} at ${metric.percentage.toFixed(0)}% of quota`,
                            metric: metric.type,
                            threshold: 75,
                        });
                    }
                }
                // Période de facturation
                const now = new Date();
                const startOfMonth = new Date(now);
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);
                const endOfMonth = new Date(now);
                endOfMonth.setMonth(endOfMonth.getMonth() + 1);
                endOfMonth.setDate(0);
                endOfMonth.setHours(23, 59, 59, 999);
                return {
                    brandId,
                    period: {
                        start: startOfMonth,
                        end: endOfMonth,
                        status: 'active',
                    },
                    metrics,
                    estimatedCost,
                    alerts,
                };
            }
            catch (error) {
                this.logger.error(`Failed to get usage summary: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Récupérer les limites d'un plan
         */
        getPlanLimits(plan) {
            return this.planLimits[plan] || this.planLimits.starter;
        }
        /**
         * Lister tous les plans disponibles
         */
        getAllPlans() {
            return Object.values(this.planLimits);
        }
    };
    __setFunctionName(_classThis, "QuotasService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuotasService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuotasService = _classThis;
})();
exports.QuotasService = QuotasService;
