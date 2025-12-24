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
exports.CostDashboardService = void 0;
const common_1 = require("@nestjs/common");
let CostDashboardService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CostDashboardService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(CostDashboardService.name);
        }
        /**
         * Génère le dashboard de coûts global
         */
        async getCostDashboard(period = 'month', startDate, endDate) {
            const now = new Date();
            const start = startDate || this.getPeriodStart(period, now);
            const end = endDate || now;
            // Récupérer les coûts IA
            const aiCosts = await this.getAICosts(start, end);
            // Récupérer les coûts par tenant
            const tenantCosts = await this.getTenantCosts(start, end);
            // Calculer les totaux
            const totalCostCents = aiCosts.reduce((sum, cost) => sum + cost.costCents, 0);
            // Grouper par feature
            const byFeature = {};
            for (const cost of aiCosts) {
                byFeature[cost.feature] = (byFeature[cost.feature] || 0) + cost.costCents;
            }
            // Grouper par provider
            const byProvider = {};
            for (const cost of aiCosts) {
                byProvider[cost.provider] = (byProvider[cost.provider] || 0) + cost.costCents;
            }
            // Calculer les trends
            const trends = await this.getCostTrends(start, end, period);
            return {
                period: `${start.toISOString()} to ${end.toISOString()}`,
                totalCostCents,
                byFeature,
                byProvider,
                byTenant: tenantCosts,
                trends,
            };
        }
        /**
         * Récupère les coûts IA
         */
        async getAICosts(start, end) {
            const costs = await this.prisma.aICost.findMany({
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
                include: {
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            // Grouper par feature et provider
            const breakdown = {};
            for (const cost of costs) {
                const key = `${cost.provider}_${cost.model}`;
                if (!breakdown[key]) {
                    breakdown[key] = {
                        feature: this.getFeatureFromModel(cost.model),
                        provider: cost.provider,
                        costCents: 0,
                        usage: 0,
                        unit: cost.tokens ? 'tokens' : 'requests',
                        period: 'month',
                    };
                }
                breakdown[key].costCents += cost.costCents;
                breakdown[key].usage += cost.tokens || 1;
            }
            return Object.values(breakdown);
        }
        /**
         * Récupère les coûts par tenant
         */
        async getTenantCosts(start, end) {
            const costs = await this.prisma.aICost.findMany({
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
                include: {
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            // Grouper par brand
            const byBrand = {};
            for (const cost of costs) {
                const brandId = cost.brandId;
                if (!byBrand[brandId]) {
                    byBrand[brandId] = {
                        brandId,
                        brandName: cost.brand.name,
                        totalCostCents: 0,
                        breakdown: [],
                        period: 'month',
                    };
                }
                byBrand[brandId].totalCostCents += cost.costCents;
                // Ajouter au breakdown
                const feature = this.getFeatureFromModel(cost.model);
                const existing = byBrand[brandId].breakdown.find((b) => b.feature === feature && b.provider === cost.provider);
                if (existing) {
                    existing.costCents += cost.costCents;
                    existing.usage += cost.tokens || 1;
                }
                else {
                    byBrand[brandId].breakdown.push({
                        feature,
                        provider: cost.provider,
                        costCents: cost.costCents,
                        usage: cost.tokens || 1,
                        unit: cost.tokens ? 'tokens' : 'requests',
                        period: 'month',
                    });
                }
            }
            // Trier par coût décroissant
            return Object.values(byBrand).sort((a, b) => b.totalCostCents - a.totalCostCents);
        }
        /**
         * Récupère les trends de coûts
         */
        async getCostTrends(start, end, period) {
            // TODO: Agréger par jour/semaine/mois
            const costs = await this.prisma.aICost.findMany({
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
                select: {
                    costCents: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            // Grouper par période
            const trends = {};
            for (const cost of costs) {
                const dateKey = this.getDateKey(cost.createdAt, period);
                trends[dateKey] = (trends[dateKey] || 0) + cost.costCents;
            }
            return Object.entries(trends)
                .map(([date, costCents]) => ({ date, costCents }))
                .sort((a, b) => a.date.localeCompare(b.date));
        }
        /**
         * Détermine la feature depuis le modèle
         */
        getFeatureFromModel(model) {
            if (model.includes('dall-e') || model.includes('sdxl')) {
                return 'image-generation';
            }
            else if (model.includes('gpt')) {
                return 'text-generation';
            }
            else {
                return 'other';
            }
        }
        /**
         * Obtient la clé de date pour le groupement
         */
        getDateKey(date, period) {
            if (period === 'day') {
                return date.toISOString().split('T')[0];
            }
            else if (period === 'week') {
                const week = this.getWeekNumber(date);
                return `${date.getFullYear()}-W${week}`;
            }
            else {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
        }
        /**
         * Obtient le numéro de semaine
         */
        getWeekNumber(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        }
        /**
         * Obtient le début de période
         */
        getPeriodStart(period, date) {
            const start = new Date(date);
            if (period === 'day') {
                start.setHours(0, 0, 0, 0);
            }
            else if (period === 'week') {
                const day = start.getDay();
                start.setDate(start.getDate() - day);
                start.setHours(0, 0, 0, 0);
            }
            else {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
            }
            return start;
        }
        /**
         * Récupère le coût d'un tenant spécifique
         */
        async getTenantCost(brandId, period = 'month') {
            const now = new Date();
            const start = this.getPeriodStart(period, now);
            const costs = await this.prisma.aICost.findMany({
                where: {
                    brandId,
                    createdAt: {
                        gte: start,
                    },
                },
                include: {
                    brand: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            const totalCostCents = costs.reduce((sum, cost) => sum + cost.costCents, 0);
            const breakdown = [];
            const byKey = {};
            for (const cost of costs) {
                const feature = this.getFeatureFromModel(cost.model);
                const key = `${feature}_${cost.provider}`;
                if (!byKey[key]) {
                    byKey[key] = {
                        feature,
                        provider: cost.provider,
                        costCents: 0,
                        usage: 0,
                        unit: cost.tokens ? 'tokens' : 'requests',
                        period,
                    };
                }
                byKey[key].costCents += cost.costCents;
                byKey[key].usage += cost.tokens || 1;
            }
            return {
                brandId,
                brandName: costs[0]?.brand.name || 'Unknown',
                totalCostCents,
                breakdown: Object.values(byKey),
                period,
            };
        }
    };
    __setFunctionName(_classThis, "CostDashboardService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CostDashboardService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CostDashboardService = _classThis;
})();
exports.CostDashboardService = CostDashboardService;
