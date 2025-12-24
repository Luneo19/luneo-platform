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
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const worker_1 = require("./worker");
const design_worker_1 = require("./workers/design/design.worker");
const render_worker_1 = require("./workers/render/render.worker");
const production_worker_1 = require("./workers/production/production.worker");
const outbox_publisher_worker_1 = require("@/libs/outbox/outbox-publisher.worker");
const outbox_scheduler_1 = require("./schedulers/outbox-scheduler");
const prisma_module_1 = require("@/libs/prisma/prisma.module");
const smart_cache_module_1 = require("@/libs/cache/smart-cache.module");
const storage_module_1 = require("@/libs/storage/storage.module");
const ai_module_1 = require("@/modules/ai/ai.module");
const product_engine_module_1 = require("@/modules/product-engine/product-engine.module");
const render_module_1 = require("@/modules/render/render.module");
const outbox_module_1 = require("@/libs/outbox/outbox.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const ai_orchestrator_module_1 = require("@/libs/ai/ai-orchestrator.module");
let JobsModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
            imports: [
                prisma_module_1.PrismaModule,
                smart_cache_module_1.SmartCacheModule,
                storage_module_1.StorageModule,
                ai_module_1.AiModule,
                product_engine_module_1.ProductEngineModule,
                render_module_1.RenderModule,
                outbox_module_1.OutboxModule,
                event_emitter_1.EventEmitterModule,
                schedule_1.ScheduleModule,
                ai_orchestrator_module_1.AIOrchestratorModule,
                bull_1.BullModule.registerQueue({
                    name: 'ai-generation',
                }),
                bull_1.BullModule.registerQueue({
                    name: 'design-generation',
                }),
                bull_1.BullModule.registerQueue({
                    name: 'render-processing',
                }),
                bull_1.BullModule.registerQueue({
                    name: 'production-processing',
                }),
                bull_1.BullModule.registerQueue({
                    name: 'outbox-publisher',
                }),
            ],
            providers: [
                worker_1.AiGenerationWorker,
                design_worker_1.DesignWorker,
                render_worker_1.RenderWorker,
                production_worker_1.ProductionWorker,
                outbox_publisher_worker_1.OutboxPublisherWorker,
                outbox_scheduler_1.OutboxScheduler,
            ],
            exports: [bull_1.BullModule],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var JobsModule = _classThis = class {
    };
    __setFunctionName(_classThis, "JobsModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        JobsModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return JobsModule = _classThis;
})();
exports.JobsModule = JobsModule;
