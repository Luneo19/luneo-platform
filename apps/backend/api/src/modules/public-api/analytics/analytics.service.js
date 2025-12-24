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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const dto_1 = require("../dto");
let AnalyticsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AnalyticsService = _classThis = class {
        constructor(prisma, cache) {
            this.prisma = prisma;
            this.cache = cache;
        }
        /**
         * Get comprehensive analytics data for a brand
         */
        async getAnalytics(brandId, query) {
            const cacheKey = `analytics:${brandId}:${JSON.stringify(query)}`;
            return this.cache.getOrSet(cacheKey, async () => {
                const startDate = query.startDate ? new Date(query.startDate) : this.getDefaultStartDate();
                const endDate = query.endDate ? new Date(query.endDate) : new Date();
                const metrics = query.metrics || Object.values(dto_1.AnalyticsMetric);
                const period = query.period || dto_1.AnalyticsPeriod.DAY;
                const [timeSeries, summary] = await Promise.all([
                    this.getTimeSeriesData(brandId, startDate, endDate, period, metrics),
                    this.getSummaryData(brandId, startDate, endDate, metrics),
                ]);
                return {
                    metrics: await this.getMetricsData(brandId, startDate, endDate, metrics),
                    timeSeries,
                    summary,
                };
            }, 300); // Cache for 5 minutes
        }
        /**
         * Get time series data for charts
         */
        async getTimeSeriesData(brandId, startDate, endDate, period, metrics) {
            const timeSeries = [];
            const current = new Date(startDate);
            while (current <= endDate) {
                const next = this.getNextPeriod(current, period);
                const periodEnd = next > endDate ? endDate : next;
                const values = {};
                for (const metric of metrics) {
                    values[metric] = await this.getMetricValue(brandId, metric, current, periodEnd);
                }
                timeSeries.push({
                    date: current.toISOString(),
                    values,
                });
                current.setTime(next.getTime());
            }
            return timeSeries;
        }
        /**
         * Get summary data for key metrics
         */
        async getSummaryData(brandId, startDate, endDate, metrics) {
            const summary = {};
            for (const metric of metrics) {
                const currentValue = await this.getMetricValue(brandId, metric, startDate, endDate);
                const previousValue = await this.getMetricValue(brandId, metric, this.getPreviousPeriod(startDate, endDate).start, this.getPreviousPeriod(startDate, endDate).end);
                summary[metric] = {
                    current: currentValue,
                    previous: previousValue,
                    change: currentValue - previousValue,
                    changePercent: previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0,
                };
            }
            return summary;
        }
        /**
         * Get individual metrics data
         */
        async getMetricsData(brandId, startDate, endDate, metrics) {
            const metricsData = {};
            for (const metric of metrics) {
                switch (metric) {
                    case dto_1.AnalyticsMetric.DESIGNS:
                        metricsData[metric] = await this.getDesignMetrics(brandId, startDate, endDate);
                        break;
                    case dto_1.AnalyticsMetric.ORDERS:
                        metricsData[metric] = await this.getOrderMetrics(brandId, startDate, endDate);
                        break;
                    case dto_1.AnalyticsMetric.REVENUE:
                        metricsData[metric] = await this.getRevenueMetrics(brandId, startDate, endDate);
                        break;
                    case dto_1.AnalyticsMetric.USERS:
                        metricsData[metric] = await this.getUserMetrics(brandId, startDate, endDate);
                        break;
                }
            }
            return metricsData;
        }
        /**
         * Get metric value for a specific period
         */
        async getMetricValue(brandId, metric, startDate, endDate) {
            switch (metric) {
                case dto_1.AnalyticsMetric.DESIGNS:
                    return this.prisma.design.count({
                        where: {
                            brandId,
                            createdAt: { gte: startDate, lte: endDate },
                        },
                    });
                case dto_1.AnalyticsMetric.ORDERS:
                    return this.prisma.order.count({
                        where: {
                            brandId,
                            createdAt: { gte: startDate, lte: endDate },
                        },
                    });
                case dto_1.AnalyticsMetric.REVENUE:
                    const result = await this.prisma.order.aggregate({
                        where: {
                            brandId,
                            createdAt: { gte: startDate, lte: endDate },
                            status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
                        },
                        _sum: { totalCents: true },
                    });
                    return Number(result._sum.totalCents || 0) / 100; // Convert cents to currency
                case dto_1.AnalyticsMetric.USERS:
                    return this.prisma.user.count({
                        where: {
                            brandId,
                            createdAt: { gte: startDate, lte: endDate },
                        },
                    });
                default:
                    return 0;
            }
        }
        /**
         * Get design-specific metrics
         */
        async getDesignMetrics(brandId, startDate, endDate) {
            const [total, completed, failed, processing] = await Promise.all([
                this.prisma.design.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate } },
                }),
                this.prisma.design.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
                }),
                this.prisma.design.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'FAILED' },
                }),
                this.prisma.design.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'PROCESSING' },
                }),
            ]);
            return {
                total,
                completed,
                failed,
                processing,
                successRate: total > 0 ? (completed / total) * 100 : 0,
            };
        }
        /**
         * Get order-specific metrics
         */
        async getOrderMetrics(brandId, startDate, endDate) {
            const [total, paid, shipped, delivered, cancelled] = await Promise.all([
                this.prisma.order.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate } },
                }),
                this.prisma.order.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'PAID' },
                }),
                this.prisma.order.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'SHIPPED' },
                }),
                this.prisma.order.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'DELIVERED' },
                }),
                this.prisma.order.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate }, status: 'CANCELLED' },
                }),
            ]);
            return {
                total,
                paid,
                shipped,
                delivered,
                cancelled,
                completionRate: total > 0 ? ((delivered + shipped) / total) * 100 : 0,
            };
        }
        /**
         * Get revenue-specific metrics
         */
        async getRevenueMetrics(brandId, startDate, endDate) {
            const [totalRevenue, averageOrderValue, orderCount] = await Promise.all([
                this.prisma.order.aggregate({
                    where: {
                        brandId,
                        createdAt: { gte: startDate, lte: endDate },
                        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
                    },
                    _sum: { totalCents: true },
                }),
                this.prisma.order.aggregate({
                    where: {
                        brandId,
                        createdAt: { gte: startDate, lte: endDate },
                        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
                    },
                    _avg: { totalCents: true },
                }),
                this.prisma.order.count({
                    where: {
                        brandId,
                        createdAt: { gte: startDate, lte: endDate },
                        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
                    },
                }),
            ]);
            return {
                total: Number(totalRevenue._sum.totalCents || 0) / 100,
                averageOrderValue: Number(averageOrderValue._avg.totalCents || 0) / 100,
                orderCount,
            };
        }
        /**
         * Get user-specific metrics
         */
        async getUserMetrics(brandId, startDate, endDate) {
            const [totalUsers, activeUsers] = await Promise.all([
                this.prisma.user.count({
                    where: { brandId, createdAt: { gte: startDate, lte: endDate } },
                }),
                this.prisma.user.count({
                    where: {
                        brandId,
                        lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
                    },
                }),
            ]);
            return {
                total: totalUsers,
                active: activeUsers,
            };
        }
        /**
         * Helper methods for date calculations
         */
        getDefaultStartDate() {
            const date = new Date();
            date.setDate(date.getDate() - 30); // Last 30 days
            return date;
        }
        getNextPeriod(date, period) {
            const next = new Date(date);
            switch (period) {
                case dto_1.AnalyticsPeriod.DAY:
                    next.setDate(next.getDate() + 1);
                    break;
                case dto_1.AnalyticsPeriod.WEEK:
                    next.setDate(next.getDate() + 7);
                    break;
                case dto_1.AnalyticsPeriod.MONTH:
                    next.setMonth(next.getMonth() + 1);
                    break;
                case dto_1.AnalyticsPeriod.YEAR:
                    next.setFullYear(next.getFullYear() + 1);
                    break;
            }
            return next;
        }
        getPreviousPeriod(startDate, endDate) {
            const duration = endDate.getTime() - startDate.getTime();
            return {
                start: new Date(startDate.getTime() - duration),
                end: new Date(endDate.getTime() - duration),
            };
        }
    };
    __setFunctionName(_classThis, "AnalyticsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnalyticsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnalyticsService = _classThis;
})();
exports.AnalyticsService = AnalyticsService;
