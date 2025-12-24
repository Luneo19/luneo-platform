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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAnalyticsDto = exports.AnalyticsPeriod = exports.AnalyticsMetric = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var AnalyticsMetric;
(function (AnalyticsMetric) {
    AnalyticsMetric["DESIGNS"] = "designs";
    AnalyticsMetric["ORDERS"] = "orders";
    AnalyticsMetric["REVENUE"] = "revenue";
    AnalyticsMetric["USERS"] = "users";
})(AnalyticsMetric || (exports.AnalyticsMetric = AnalyticsMetric = {}));
var AnalyticsPeriod;
(function (AnalyticsPeriod) {
    AnalyticsPeriod["DAY"] = "day";
    AnalyticsPeriod["WEEK"] = "week";
    AnalyticsPeriod["MONTH"] = "month";
    AnalyticsPeriod["YEAR"] = "year";
})(AnalyticsPeriod || (exports.AnalyticsPeriod = AnalyticsPeriod = {}));
let GetAnalyticsDto = (() => {
    var _a;
    let _startDate_decorators;
    let _startDate_initializers = [];
    let _startDate_extraInitializers = [];
    let _endDate_decorators;
    let _endDate_initializers = [];
    let _endDate_extraInitializers = [];
    let _metrics_decorators;
    let _metrics_initializers = [];
    let _metrics_extraInitializers = [];
    let _period_decorators;
    let _period_initializers = [];
    let _period_extraInitializers = [];
    let _filters_decorators;
    let _filters_initializers = [];
    let _filters_extraInitializers = [];
    return _a = class GetAnalyticsDto {
            constructor() {
                this.startDate = __runInitializers(this, _startDate_initializers, void 0);
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.metrics = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _metrics_initializers, void 0));
                this.period = (__runInitializers(this, _metrics_extraInitializers), __runInitializers(this, _period_initializers, void 0));
                this.filters = (__runInitializers(this, _period_extraInitializers), __runInitializers(this, _filters_initializers, void 0));
                __runInitializers(this, _filters_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _startDate_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Start date for analytics (ISO string)',
                    example: '2024-01-01T00:00:00.000Z'
                }), (0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _endDate_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'End date for analytics (ISO string)',
                    example: '2024-12-31T23:59:59.999Z'
                }), (0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _metrics_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Analytics metric to retrieve',
                    enum: AnalyticsMetric,
                    isArray: true
                }), (0, class_validator_1.IsEnum)(AnalyticsMetric, { each: true }), (0, class_validator_1.IsOptional)()];
            _period_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Grouping period for analytics',
                    enum: AnalyticsPeriod
                }), (0, class_validator_1.IsEnum)(AnalyticsPeriod), (0, class_validator_1.IsOptional)()];
            _filters_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    description: 'Additional filters as JSON string'
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: obj => "startDate" in obj, get: obj => obj.startDate, set: (obj, value) => { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: obj => "endDate" in obj, get: obj => obj.endDate, set: (obj, value) => { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _metrics_decorators, { kind: "field", name: "metrics", static: false, private: false, access: { has: obj => "metrics" in obj, get: obj => obj.metrics, set: (obj, value) => { obj.metrics = value; } }, metadata: _metadata }, _metrics_initializers, _metrics_extraInitializers);
            __esDecorate(null, null, _period_decorators, { kind: "field", name: "period", static: false, private: false, access: { has: obj => "period" in obj, get: obj => obj.period, set: (obj, value) => { obj.period = value; } }, metadata: _metadata }, _period_initializers, _period_extraInitializers);
            __esDecorate(null, null, _filters_decorators, { kind: "field", name: "filters", static: false, private: false, access: { has: obj => "filters" in obj, get: obj => obj.filters, set: (obj, value) => { obj.filters = value; } }, metadata: _metadata }, _filters_initializers, _filters_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.GetAnalyticsDto = GetAnalyticsDto;
