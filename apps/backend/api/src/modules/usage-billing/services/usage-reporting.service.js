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
exports.UsageReportingService = void 0;
const common_1 = require("@nestjs/common");
/**
 * Service de reporting d'usage
 * Génère des rapports et exports pour les clients
 */
let UsageReportingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsageReportingService = _classThis = class {
        constructor(prisma, meteringService, calculationService) {
            this.prisma = prisma;
            this.meteringService = meteringService;
            this.calculationService = calculationService;
            this.logger = new common_1.Logger(UsageReportingService.name);
        }
        /**
         * Générer un rapport mensuel complet
         */
        async generateMonthlyReport(brandId, year, month) {
            try {
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);
                // Récupérer tous les enregistrements d'usage
                // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                const usageRecords = await this.prisma.usageMetric.findMany({
                    where: {
                        brandId,
                        timestamp: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    orderBy: {
                        timestamp: 'asc',
                    },
                });
                // Agréger par métrique et par jour
                const dailyBreakdown = {};
                const metricTotals = {};
                for (const record of usageRecords) {
                    const day = record.timestamp.toISOString().split('T')[0];
                    if (!dailyBreakdown[day]) {
                        dailyBreakdown[day] = {};
                    }
                    dailyBreakdown[day][record.metric] =
                        (dailyBreakdown[day][record.metric] || 0) + record.value;
                    metricTotals[record.metric] =
                        (metricTotals[record.metric] || 0) + record.value;
                }
                // Calculer la facture
                const bill = await this.calculationService.calculateCurrentBill(brandId);
                // Statistiques
                const stats = {
                    totalRecords: usageRecords.length,
                    daysActive: Object.keys(dailyBreakdown).length,
                    metricsUsed: Object.keys(metricTotals).length,
                    averageDaily: usageRecords.length / Object.keys(dailyBreakdown).length,
                };
                return {
                    period: {
                        year,
                        month,
                        startDate,
                        endDate,
                    },
                    dailyBreakdown,
                    metricTotals,
                    bill,
                    stats,
                };
            }
            catch (error) {
                this.logger.error(`Failed to generate monthly report: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Exporter l'usage en CSV
         */
        async exportToCSV(brandId, startDate, endDate) {
            try {
                // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                const records = await this.prisma.usageMetric.findMany({
                    where: {
                        brandId,
                        timestamp: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    orderBy: {
                        timestamp: 'asc',
                    },
                });
                // Header CSV
                let csv = 'Date,Time,Metric,Value,Unit,Metadata\n';
                // Lignes
                for (const record of records) {
                    const date = record.timestamp.toISOString().split('T')[0];
                    const time = record.timestamp.toISOString().split('T')[1].split('.')[0];
                    const metadata = JSON.stringify(record.metadata || {});
                    csv += `${date},${time},${record.metric},${record.value},${this.getUnitForMetric(record.metric)},${metadata}\n`;
                }
                return csv;
            }
            catch (error) {
                this.logger.error(`Failed to export to CSV: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Générer un résumé exécutif
         */
        async generateExecutiveSummary(brandId) {
            try {
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId },
                    select: { name: true, plan: true, createdAt: true },
                });
                if (!brand) {
                    throw new Error('Brand not found');
                }
                // Usage actuel
                const currentUsage = await this.meteringService.getCurrentUsage(brandId);
                // Facture actuelle
                const currentBill = await this.calculationService.calculateCurrentBill(brandId);
                // Projections
                const projections = await this.calculationService.projectCosts(brandId, 30);
                // Top métriques
                const topMetrics = Object.entries(currentUsage)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([metric, value]) => ({ metric, value }));
                // Tendances (comparaison avec le mois dernier)
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                const lastMonthReport = await this.generateMonthlyReport(brandId, lastMonth.getFullYear(), lastMonth.getMonth() + 1);
                const trends = {};
                for (const [metric, currentValue] of Object.entries(currentUsage)) {
                    const lastValue = lastMonthReport.metricTotals[metric] || 0;
                    if (lastValue > 0) {
                        trends[metric] = ((currentValue - lastValue) / lastValue) * 100;
                    }
                }
                return {
                    brand: {
                        name: brand.name,
                        plan: brand.plan,
                        memberSince: brand.createdAt,
                    },
                    currentPeriod: {
                        usage: currentUsage,
                        bill: currentBill,
                    },
                    projections,
                    topMetrics,
                    trends,
                    insights: this.generateInsights(currentUsage, trends, projections),
                };
            }
            catch (error) {
                this.logger.error(`Failed to generate executive summary: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Générer des insights automatiques
         */
        generateInsights(usage, trends, projections) {
            const insights = [];
            // Insight sur les tendances
            for (const [metric, trend] of Object.entries(trends)) {
                if (trend > 50) {
                    insights.push(`📈 ${metric} has increased by ${trend.toFixed(0)}% compared to last month`);
                }
                else if (trend < -30) {
                    insights.push(`📉 ${metric} has decreased by ${Math.abs(trend).toFixed(0)}% compared to last month`);
                }
            }
            // Insight sur les projections
            if (projections.projectedOverage > 5000) {
                insights.push(`⚠️  Projected overage costs: €${(projections.projectedOverage / 100).toFixed(2)}. Consider upgrading your plan.`);
            }
            // Insight sur l'utilisation
            const totalUsage = Object.values(usage).reduce((a, b) => a + b, 0);
            if (totalUsage === 0) {
                insights.push('💡 You haven\'t used any resources this month. Start creating!');
            }
            else if (totalUsage > 1000) {
                insights.push('🚀 High activity detected! Your platform is thriving.');
            }
            // Recommendations
            if (projections.recommendations && projections.recommendations.length > 0) {
                insights.push(...projections.recommendations);
            }
            return insights;
        }
        /**
         * Générer un rapport détaillé par métrique
         */
        async getMetricDetail(brandId, metric, startDate, endDate) {
            try {
                // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                const records = await this.prisma.usageMetric.findMany({
                    where: {
                        brandId,
                        metric,
                        timestamp: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    orderBy: {
                        timestamp: 'asc',
                    },
                });
                // Statistiques
                const values = records.map((r) => r.value);
                const total = values.reduce((a, b) => a + b, 0);
                const average = total / values.length || 0;
                const max = Math.max(...values, 0);
                const min = Math.min(...values, 999999);
                // Grouper par jour
                const dailyData = {};
                for (const record of records) {
                    const day = record.timestamp.toISOString().split('T')[0];
                    if (!dailyData[day]) {
                        dailyData[day] = { count: 0, total: 0 };
                    }
                    dailyData[day].count++;
                    dailyData[day].total += record.value;
                }
                // Grouper par heure de la journée (pattern)
                const hourlyPattern = {};
                for (const record of records) {
                    const hour = record.timestamp.getHours();
                    hourlyPattern[hour] = (hourlyPattern[hour] || 0) + record.value;
                }
                return {
                    metric,
                    period: { startDate, endDate },
                    stats: {
                        total,
                        average,
                        max,
                        min,
                        count: records.length,
                    },
                    dailyData,
                    hourlyPattern,
                    rawRecords: records.slice(0, 100), // Limiter à 100 pour ne pas surcharger
                };
            }
            catch (error) {
                this.logger.error(`Failed to get metric detail: ${error.message}`, error.stack);
                throw error;
            }
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
    };
    __setFunctionName(_classThis, "UsageReportingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsageReportingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsageReportingService = _classThis;
})();
exports.UsageReportingService = UsageReportingService;
