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
exports.DLQController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("@/modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("@/common/guards/roles.guard");
const roles_guard_2 = require("@/common/guards/roles.guard");
let DLQController = (() => {
    let _classDecorators = [(0, common_1.Controller)('admin/dlq'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_guard_2.Roles)('PLATFORM_ADMIN')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getStats_decorators;
    let _getFailedJobs_decorators;
    let _retryJob_decorators;
    let _removeJob_decorators;
    let _cleanup_decorators;
    var DLQController = _classThis = class {
        constructor(dlqService) {
            this.dlqService = (__runInitializers(this, _instanceExtraInitializers), dlqService);
        }
        async getStats() {
            return this.dlqService.getFailedStats();
        }
        async getFailedJobs(queueName, limit = '50') {
            const jobs = await this.dlqService.getFailedJobs(queueName, parseInt(limit, 10));
            return {
                queue: queueName,
                count: jobs.length,
                jobs: jobs.map((job) => ({
                    id: job.id,
                    data: job.data,
                    failedReason: job.failedReason,
                    failedAt: job.timestamp || new Date(),
                    attemptsMade: job.attemptsMade,
                })),
            };
        }
        async retryJob(queueName, jobId) {
            await this.dlqService.retryJob(queueName, jobId);
            return { success: true, message: `Job ${jobId} queued for retry` };
        }
        async removeJob(queueName, jobId) {
            await this.dlqService.removeJob(queueName, jobId);
            return { success: true, message: `Job ${jobId} removed` };
        }
        async cleanup(queueName, days = '30') {
            const removed = await this.dlqService.cleanupOldFailedJobs(queueName, parseInt(days, 10));
            return { success: true, removed };
        }
    };
    __setFunctionName(_classThis, "DLQController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getStats_decorators = [(0, common_1.Get)('stats')];
        _getFailedJobs_decorators = [(0, common_1.Get)(':queueName')];
        _retryJob_decorators = [(0, common_1.Post)(':queueName/:jobId/retry')];
        _removeJob_decorators = [(0, common_1.Delete)(':queueName/:jobId')];
        _cleanup_decorators = [(0, common_1.Post)(':queueName/cleanup')];
        __esDecorate(_classThis, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: obj => "getStats" in obj, get: obj => obj.getStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFailedJobs_decorators, { kind: "method", name: "getFailedJobs", static: false, private: false, access: { has: obj => "getFailedJobs" in obj, get: obj => obj.getFailedJobs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _retryJob_decorators, { kind: "method", name: "retryJob", static: false, private: false, access: { has: obj => "retryJob" in obj, get: obj => obj.retryJob }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeJob_decorators, { kind: "method", name: "removeJob", static: false, private: false, access: { has: obj => "removeJob" in obj, get: obj => obj.removeJob }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cleanup_decorators, { kind: "method", name: "cleanup", static: false, private: false, access: { has: obj => "cleanup" in obj, get: obj => obj.cleanup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DLQController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DLQController = _classThis;
})();
exports.DLQController = DLQController;
