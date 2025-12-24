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
let AnalyticsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AnalyticsService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(AnalyticsService.name);
        }
        async getDashboard(period = 'last_30_days') {
            try {
                this.logger.log(`Getting dashboard analytics for period: ${period}`);
                // Simulation des métriques
                const metrics = {
                    totalDesigns: 1250,
                    totalRenders: 3400,
                    activeUsers: 89,
                    revenue: 15420.50,
                    conversionRate: 12.5,
                    avgSessionDuration: '8m 30s'
                };
                const charts = {
                    designsOverTime: [
                        { date: '2025-10-01', count: 45 },
                        { date: '2025-10-02', count: 52 },
                        { date: '2025-10-03', count: 38 },
                        { date: '2025-10-04', count: 67 },
                        { date: '2025-10-05', count: 71 }
                    ],
                    revenueOverTime: [
                        { date: '2025-10-01', amount: 450.00 },
                        { date: '2025-10-02', amount: 520.00 },
                        { date: '2025-10-03', amount: 380.00 },
                        { date: '2025-10-04', amount: 670.00 },
                        { date: '2025-10-05', amount: 710.00 }
                    ]
                };
                return {
                    period,
                    metrics,
                    charts
                };
            }
            catch (error) {
                this.logger.error(`Failed to get dashboard analytics: ${error.message}`);
                throw error;
            }
        }
        async getUsage(brandId) {
            try {
                this.logger.log(`Getting usage analytics for brand: ${brandId}`);
                return {
                    success: true,
                    usage: {
                        designs: { used: 45, limit: 100, unit: 'designs' },
                        renders: { used: 120, limit: 500, unit: 'renders' },
                        storage: { used: 2.5, limit: 10, unit: 'GB' },
                        apiCalls: { used: 15000, limit: 100000, unit: 'calls' }
                    }
                };
            }
            catch (error) {
                this.logger.error(`Failed to get usage analytics: ${error.message}`);
                throw error;
            }
        }
        async getRevenue(period = 'last_30_days') {
            try {
                this.logger.log(`Getting revenue analytics for period: ${period}`);
                return {
                    success: true,
                    period,
                    revenue: {
                        total: 15420.50,
                        currency: 'EUR',
                        breakdown: {
                            subscriptions: 12000.00,
                            usage: 3420.50
                        }
                    }
                };
            }
            catch (error) {
                this.logger.error(`Failed to get revenue analytics: ${error.message}`);
                throw error;
            }
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
