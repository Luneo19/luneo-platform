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
exports.BillingCalculationService = void 0;
const common_1 = require("@nestjs/common");
/**
 * Service de calcul de facturation
 * Calcule les coûts basés sur l'usage et les quotas
 */
let BillingCalculationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BillingCalculationService = _classThis = class {
        constructor(prisma, meteringService, quotasService) {
            this.prisma = prisma;
            this.meteringService = meteringService;
            this.quotasService = quotasService;
            this.logger = new common_1.Logger(BillingCalculationService.name);
        }
        /**
         * Calculer la facture du mois en cours
         */
        async calculateCurrentBill(brandId) {
            try {
                // Récupérer le plan du brand
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: { plan: true, country: true },
                });
                if (!brand) {
                    throw new Error('Brand not found');
                }
                const planLimits = this.quotasService.getPlanLimits(brand.plan || 'starter');
                // Période de facturation
                const now = new Date();
                const startOfMonth = new Date(now);
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);
                const endOfMonth = new Date(now);
                endOfMonth.setMonth(endOfMonth.getMonth() + 1);
                endOfMonth.setDate(0);
                endOfMonth.setHours(23, 59, 59, 999);
                // Récupérer l'usage actuel
                const currentUsage = await this.meteringService.getCurrentUsage(brandId);
                // Calculer les coûts par métrique
                const usageCosts = {};
                const overageCosts = {};
                const breakdown = [];
                let totalUsageCost = 0;
                let totalOverageCost = 0;
                for (const quota of planLimits.quotas) {
                    const quantity = currentUsage[quota.metric] || 0;
                    const overage = Math.max(0, quantity - quota.limit);
                    const unitPrice = quota.overageRate || 0;
                    let cost = 0;
                    if (overage > 0 && quota.overage === 'charge') {
                        cost = overage * unitPrice;
                        overageCosts[quota.metric] = cost;
                        totalOverageCost += cost;
                    }
                    breakdown.push({
                        metric: quota.metric,
                        quantity,
                        limit: quota.limit,
                        overage,
                        unitPrice,
                        cost,
                    });
                }
                // Calcul de la taxe (TVA 20% pour la France)
                const subtotal = planLimits.basePrice + totalUsageCost + totalOverageCost;
                const taxRate = this.getTaxRate(brand.country || 'FR');
                const tax = Math.round(subtotal * taxRate);
                const total = subtotal + tax;
                return {
                    period: {
                        start: startOfMonth,
                        end: endOfMonth,
                    },
                    basePrice: planLimits.basePrice,
                    usageCosts: usageCosts,
                    totalUsageCost,
                    overageCosts: overageCosts,
                    totalOverageCost,
                    subtotal,
                    tax,
                    total,
                    breakdown,
                };
            }
            catch (error) {
                this.logger.error(`Failed to calculate bill: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Calculer le coût estimé d'une action
         */
        async estimateActionCost(brandId, metric, quantity = 1) {
            try {
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: { plan: true },
                });
                if (!brand) {
                    throw new Error('Brand not found');
                }
                const planLimits = this.quotasService.getPlanLimits(brand.plan || 'starter');
                const quota = planLimits.quotas.find((q) => q.metric === metric);
                if (!quota) {
                    return {
                        metric,
                        quantity,
                        currentUsage: 0,
                        limit: 999999,
                        willExceed: false,
                        overageAmount: 0,
                        unitPrice: 0,
                        estimatedCost: 0,
                        totalAfter: 0,
                    };
                }
                const currentUsage = await this.meteringService.getCurrentUsage(brandId);
                const used = currentUsage[metric] || 0;
                const afterUsage = used + quantity;
                const willExceed = afterUsage > quota.limit;
                const overageAmount = Math.max(0, afterUsage - quota.limit);
                const unitPrice = quota.overageRate || 0;
                const estimatedCost = willExceed ? overageAmount * unitPrice : 0;
                const currentBill = await this.calculateCurrentBill(brandId);
                const totalAfter = currentBill.total + estimatedCost;
                return {
                    metric,
                    quantity,
                    currentUsage: used,
                    limit: quota.limit,
                    willExceed,
                    overageAmount,
                    unitPrice,
                    estimatedCost,
                    totalAfter,
                };
            }
            catch (error) {
                this.logger.error(`Failed to estimate cost: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Calculer les projections de coût
         */
        async projectCosts(brandId, days = 30) {
            try {
                // Récupérer l'usage des 7 derniers jours
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                const recentUsage = await this.prisma.usageMetric.findMany({
                    where: {
                        brandId,
                        timestamp: {
                            gte: sevenDaysAgo,
                        },
                    },
                });
                // Calculer l'usage moyen quotidien par métrique
                const dailyAverages = {};
                const metricCounts = {};
                for (const record of recentUsage) {
                    if (!dailyAverages[record.metric]) {
                        dailyAverages[record.metric] = 0;
                        metricCounts[record.metric] = 0;
                    }
                    dailyAverages[record.metric] += record.value;
                    metricCounts[record.metric]++;
                }
                // Moyenne sur 7 jours
                for (const metric in dailyAverages) {
                    dailyAverages[metric] = dailyAverages[metric] / 7;
                }
                // Projeter sur le nombre de jours demandé
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: { plan: true },
                });
                const planLimits = this.quotasService.getPlanLimits(brand?.plan || 'starter');
                let projectedOverage = 0;
                const recommendations = [];
                for (const quota of planLimits.quotas) {
                    const dailyAvg = dailyAverages[quota.metric] || 0;
                    const projected = dailyAvg * days;
                    if (projected > quota.limit * 0.9) {
                        // Va dépasser 90% du quota
                        recommendations.push(`⚠️  ${quota.metric} will reach ${((projected / quota.limit) * 100).toFixed(0)}% of quota. Consider upgrading.`);
                    }
                    if (projected > quota.limit && quota.overage === 'charge') {
                        const overage = projected - quota.limit;
                        const cost = overage * (quota.overageRate || 0);
                        projectedOverage += cost;
                    }
                }
                // Coût journalier moyen actuel
                const currentBill = await this.calculateCurrentBill(brandId);
                const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                const currentDaily = currentBill.totalOverageCost / daysInMonth;
                const projectedMonthly = planLimits.basePrice + projectedOverage;
                return {
                    currentDaily,
                    projectedMonthly,
                    projectedOverage,
                    recommendations,
                };
            }
            catch (error) {
                this.logger.error(`Failed to project costs: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Récupérer le taux de taxe selon le pays
         */
        getTaxRate(country) {
            const taxRates = {
                FR: 0.2, // 20% TVA France
                BE: 0.21, // 21% TVA Belgique
                DE: 0.19, // 19% TVA Allemagne
                ES: 0.21, // 21% TVA Espagne
                IT: 0.22, // 22% TVA Italie
                UK: 0.2, // 20% VAT UK
                US: 0, // Pas de TVA fédérale
            };
            return taxRates[country] || 0.2; // Par défaut 20%
        }
        /**
         * Comparer les coûts entre différents plans
         */
        async comparePlans(brandId) {
            try {
                const currentUsage = await this.meteringService.getCurrentUsage(brandId);
                const allPlans = this.quotasService.getAllPlans();
                const comparisons = [];
                for (const planLimits of allPlans) {
                    let overageCost = 0;
                    for (const quota of planLimits.quotas) {
                        const used = currentUsage[quota.metric] || 0;
                        const overage = Math.max(0, used - quota.limit);
                        if (overage > 0 && quota.overage === 'charge') {
                            overageCost += overage * (quota.overageRate || 0);
                        }
                    }
                    const total = planLimits.basePrice + overageCost;
                    comparisons.push({
                        plan: planLimits.plan,
                        basePrice: planLimits.basePrice,
                        estimatedOverage: overageCost,
                        total,
                    });
                }
                // Trier par total
                comparisons.sort((a, b) => a.total - b.total);
                // Ajouter les recommandations et savings
                const cheapest = comparisons[0];
                return comparisons.map((comp) => ({
                    ...comp,
                    savings: comp.total - cheapest.total,
                    recommendation: comp === cheapest
                        ? '✅ Best value for your usage'
                        : comp.savings > 5000
                            ? '⚠️  Significantly more expensive'
                            : '💰 Acceptable alternative',
                }));
            }
            catch (error) {
                this.logger.error(`Failed to compare plans: ${error.message}`, error.stack);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "BillingCalculationService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BillingCalculationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BillingCalculationService = _classThis;
})();
exports.BillingCalculationService = BillingCalculationService;
