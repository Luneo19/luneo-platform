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
exports.ObservabilityModule = void 0;
const common_1 = require("@nestjs/common");
const observability_controller_1 = require("./observability.controller");
const slo_sli_service_1 = require("./services/slo-sli.service");
const tracing_service_1 = require("./services/tracing.service");
const cost_dashboard_service_1 = require("./services/cost-dashboard.service");
const dr_service_1 = require("./services/dr.service");
const observability_scheduler_1 = require("./schedulers/observability.scheduler");
const prisma_module_1 = require("@/libs/prisma/prisma.module");
const schedule_1 = require("@nestjs/schedule");
const integrations_module_1 = require("@/libs/integrations/integrations.module");
let ObservabilityModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [prisma_module_1.PrismaModule, schedule_1.ScheduleModule, integrations_module_1.IntegrationsModule],
            controllers: [observability_controller_1.ObservabilityController],
            providers: [slo_sli_service_1.SLOService, tracing_service_1.TracingService, cost_dashboard_service_1.CostDashboardService, dr_service_1.DRService, observability_scheduler_1.ObservabilityScheduler],
            exports: [slo_sli_service_1.SLOService, tracing_service_1.TracingService, cost_dashboard_service_1.CostDashboardService, dr_service_1.DRService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ObservabilityModule = _classThis = class {
    };
    __setFunctionName(_classThis, "ObservabilityModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ObservabilityModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ObservabilityModule = _classThis;
})();
exports.ObservabilityModule = ObservabilityModule;
