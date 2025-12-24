"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageBillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
/**
 * Controller pour la gestion du billing usage-based
 */
let UsageBillingController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Usage & Billing'), (0, common_1.Controller)('usage-billing'), (0, swagger_1.ApiBearerAuth)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _recordUsage_decorators;
    let _getCurrentUsage_decorators;
    let _checkQuota_decorators;
    let _getUsageSummary_decorators;
    let _getCurrentBill_decorators;
    let _estimateActionCost_decorators;
    let _projectCosts_decorators;
    let _comparePlans_decorators;
    let _getPlanLimits_decorators;
    let _getAllPlans_decorators;
    let _getMonthlyReport_decorators;
    let _exportToCSV_decorators;
    let _getExecutiveSummary_decorators;
    let _getMetricDetail_decorators;
    let _getUsageStats_decorators;
    let _getUsageHistory_decorators;
    var UsageBillingController = _classThis = class {
        constructor(meteringService, trackingService, quotasService, calculationService, reportingService) {
            this.meteringService = (__runInitializers(this, _instanceExtraInitializers), meteringService);
            this.trackingService = trackingService;
            this.quotasService = quotasService;
            this.calculationService = calculationService;
            this.reportingService = reportingService;
        }
        /**
         * Enregistrer une métrique d'usage manuellement
         */
        async recordUsage(body) {
            return this.meteringService.recordUsage(body.brandId, body.metric, body.value, body.metadata);
        }
        /**
         * Récupérer l'usage actuel d'un brand
         */
        async getCurrentUsage(brandId) {
            const usage = await this.meteringService.getCurrentUsage(brandId);
            return { brandId, usage };
        }
        /**
         * Vérifier un quota avant action
         */
        async checkQuota(body) {
            return this.quotasService.checkQuota(body.brandId, body.metric, body.requestedAmount);
        }
        /**
         * Récupérer le résumé d'usage complet
         */
        async getUsageSummary(brandId) {
            return this.quotasService.getUsageSummary(brandId);
        }
        /**
         * Calculer la facture actuelle
         */
        async getCurrentBill(brandId) {
            return this.calculationService.calculateCurrentBill(brandId);
        }
        /**
         * Estimer le coût d'une action
         */
        async estimateActionCost(body) {
            return this.calculationService.estimateActionCost(body.brandId, body.metric, body.quantity);
        }
        /**
         * Projeter les coûts futurs
         */
        async projectCosts(brandId, days) {
            const daysNum = days ? parseInt(days, 10) : 30;
            return this.calculationService.projectCosts(brandId, daysNum);
        }
        /**
         * Comparer les plans
         */
        async comparePlans(brandId) {
            return this.calculationService.comparePlans(brandId);
        }
        /**
         * Récupérer les limites d'un plan
         */
        async getPlanLimits(plan) {
            return this.quotasService.getPlanLimits(plan);
        }
        /**
         * Lister tous les plans
         */
        async getAllPlans() {
            return this.quotasService.getAllPlans();
        }
        /**
         * Générer un rapport mensuel
         */
        async getMonthlyReport(brandId, year, month) {
            const yearNum = parseInt(year, 10) || new Date().getFullYear();
            const monthNum = parseInt(month, 10) || new Date().getMonth() + 1;
            return this.reportingService.generateMonthlyReport(brandId, yearNum, monthNum);
        }
        /**
         * Exporter l'usage en CSV
         */
        async exportToCSV(brandId, startDate, endDate) {
            const start = startDate ? new Date(startDate) : new Date();
            start.setDate(1);
            const end = endDate ? new Date(endDate) : new Date();
            const csv = await this.reportingService.exportToCSV(brandId, start, end);
            return {
                csv,
                filename: `usage-${brandId}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv`,
            };
        }
        /**
         * Résumé exécutif
         */
        async getExecutiveSummary(brandId) {
            return this.reportingService.generateExecutiveSummary(brandId);
        }
        /**
         * Détails d'une métrique
         */
        async getMetricDetail(brandId, metric, startDate, endDate) {
            const start = startDate ? new Date(startDate) : new Date();
            start.setDate(1);
            const end = endDate ? new Date(endDate) : new Date();
            return this.reportingService.getMetricDetail(brandId, metric, start, end);
        }
        /**
         * Statistiques d'usage
         */
        async getUsageStats(brandId, period = 'month') {
            return this.trackingService.getUsageStats(brandId, period);
        }
        /**
         * Historique d'usage
         */
        async getUsageHistory(brandId, metric, limit) {
            const limitNum = limit ? parseInt(limit, 10) : 100;
            return this.trackingService.getUsageHistory(brandId, metric, limitNum);
        }
    };
    __setFunctionName(_classThis, "UsageBillingController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _recordUsage_decorators = [(0, common_1.Post)('record'), (0, swagger_1.ApiOperation)({ summary: 'Record a usage metric' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Usage recorded' })];
        _getCurrentUsage_decorators = [(0, common_1.Get)('current/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Get current usage for a brand' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Current usage retrieved' })];
        _checkQuota_decorators = [(0, common_1.Post)('check-quota'), (0, swagger_1.ApiOperation)({ summary: 'Check if action is within quota' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Quota check result' })];
        _getUsageSummary_decorators = [(0, common_1.Get)('summary/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Get complete usage summary with quotas and alerts' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage summary retrieved' })];
        _getCurrentBill_decorators = [(0, common_1.Get)('bill/current/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Calculate current bill for the month' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Bill calculated' })];
        _estimateActionCost_decorators = [(0, common_1.Post)('estimate'), (0, swagger_1.ApiOperation)({ summary: 'Estimate cost of an action' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Cost estimated' })];
        _projectCosts_decorators = [(0, common_1.Get)('projections/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Project future costs based on usage trends' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Cost projections calculated' })];
        _comparePlans_decorators = [(0, common_1.Get)('compare-plans/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Compare costs across different plans' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan comparison retrieved' })];
        _getPlanLimits_decorators = [(0, common_1.Get)('plans/:plan'), (0, swagger_1.ApiOperation)({ summary: 'Get plan limits and features' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan limits retrieved' })];
        _getAllPlans_decorators = [(0, common_1.Get)('plans'), (0, swagger_1.ApiOperation)({ summary: 'List all available plans' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'All plans retrieved' })];
        _getMonthlyReport_decorators = [(0, common_1.Get)('reports/monthly/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Generate monthly usage report' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Monthly report generated' })];
        _exportToCSV_decorators = [(0, common_1.Get)('export/csv/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Export usage to CSV' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV exported' })];
        _getExecutiveSummary_decorators = [(0, common_1.Get)('reports/executive/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Generate executive summary' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Executive summary generated' })];
        _getMetricDetail_decorators = [(0, common_1.Get)('metrics/:brandId/:metric'), (0, swagger_1.ApiOperation)({ summary: 'Get detailed analytics for a specific metric' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Metric details retrieved' })];
        _getUsageStats_decorators = [(0, common_1.Get)('stats/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Get usage statistics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage stats retrieved' })];
        _getUsageHistory_decorators = [(0, common_1.Get)('history/:brandId'), (0, swagger_1.ApiOperation)({ summary: 'Get usage history' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage history retrieved' })];
        __esDecorate(_classThis, null, _recordUsage_decorators, { kind: "method", name: "recordUsage", static: false, private: false, access: { has: obj => "recordUsage" in obj, get: obj => obj.recordUsage }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCurrentUsage_decorators, { kind: "method", name: "getCurrentUsage", static: false, private: false, access: { has: obj => "getCurrentUsage" in obj, get: obj => obj.getCurrentUsage }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkQuota_decorators, { kind: "method", name: "checkQuota", static: false, private: false, access: { has: obj => "checkQuota" in obj, get: obj => obj.checkQuota }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsageSummary_decorators, { kind: "method", name: "getUsageSummary", static: false, private: false, access: { has: obj => "getUsageSummary" in obj, get: obj => obj.getUsageSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCurrentBill_decorators, { kind: "method", name: "getCurrentBill", static: false, private: false, access: { has: obj => "getCurrentBill" in obj, get: obj => obj.getCurrentBill }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _estimateActionCost_decorators, { kind: "method", name: "estimateActionCost", static: false, private: false, access: { has: obj => "estimateActionCost" in obj, get: obj => obj.estimateActionCost }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _projectCosts_decorators, { kind: "method", name: "projectCosts", static: false, private: false, access: { has: obj => "projectCosts" in obj, get: obj => obj.projectCosts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _comparePlans_decorators, { kind: "method", name: "comparePlans", static: false, private: false, access: { has: obj => "comparePlans" in obj, get: obj => obj.comparePlans }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPlanLimits_decorators, { kind: "method", name: "getPlanLimits", static: false, private: false, access: { has: obj => "getPlanLimits" in obj, get: obj => obj.getPlanLimits }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllPlans_decorators, { kind: "method", name: "getAllPlans", static: false, private: false, access: { has: obj => "getAllPlans" in obj, get: obj => obj.getAllPlans }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMonthlyReport_decorators, { kind: "method", name: "getMonthlyReport", static: false, private: false, access: { has: obj => "getMonthlyReport" in obj, get: obj => obj.getMonthlyReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportToCSV_decorators, { kind: "method", name: "exportToCSV", static: false, private: false, access: { has: obj => "exportToCSV" in obj, get: obj => obj.exportToCSV }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getExecutiveSummary_decorators, { kind: "method", name: "getExecutiveSummary", static: false, private: false, access: { has: obj => "getExecutiveSummary" in obj, get: obj => obj.getExecutiveSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMetricDetail_decorators, { kind: "method", name: "getMetricDetail", static: false, private: false, access: { has: obj => "getMetricDetail" in obj, get: obj => obj.getMetricDetail }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsageStats_decorators, { kind: "method", name: "getUsageStats", static: false, private: false, access: { has: obj => "getUsageStats" in obj, get: obj => obj.getUsageStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsageHistory_decorators, { kind: "method", name: "getUsageHistory", static: false, private: false, access: { has: obj => "getUsageHistory" in obj, get: obj => obj.getUsageHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsageBillingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsageBillingController = _classThis;
})();
exports.UsageBillingController = UsageBillingController;
