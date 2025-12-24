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
exports.DLQService = void 0;
const common_1 = require("@nestjs/common");
let DLQService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DLQService = _classThis = class {
        constructor(aiQueue, designQueue, renderQueue, productionQueue) {
            this.aiQueue = aiQueue;
            this.designQueue = designQueue;
            this.renderQueue = renderQueue;
            this.productionQueue = productionQueue;
            this.logger = new common_1.Logger(DLQService.name);
        }
        /**
         * Récupère toutes les queues
         */
        getQueues() {
            return new Map([
                ['ai-generation', this.aiQueue],
                ['design-generation', this.designQueue],
                ['render-processing', this.renderQueue],
                ['production-processing', this.productionQueue],
            ]);
        }
        /**
         * Récupère les jobs échoués d'une queue
         */
        async getFailedJobs(queueName, limit = 50) {
            const queue = this.getQueues().get(queueName);
            if (!queue) {
                throw new Error(`Queue ${queueName} not found`);
            }
            const failed = await queue.getFailed(0, limit - 1);
            return failed;
        }
        /**
         * Récupère les stats des jobs échoués
         */
        async getFailedStats() {
            const stats = {};
            for (const [queueName, queue] of this.getQueues()) {
                const failed = await queue.getFailed(0, 99);
                const oldest = failed.length > 0 ? new Date(failed[failed.length - 1].timestamp || Date.now()) : null;
                stats[queueName] = {
                    count: failed.length,
                    oldest,
                };
            }
            return stats;
        }
        /**
         * Réessaye un job échoué
         */
        async retryJob(queueName, jobId) {
            const queue = this.getQueues().get(queueName);
            if (!queue) {
                throw new Error(`Queue ${queueName} not found`);
            }
            const job = await queue.getJob(jobId);
            if (!job) {
                throw new Error(`Job ${jobId} not found in queue ${queueName}`);
            }
            if (!job.failedReason) {
                throw new Error(`Job ${jobId} is not failed`);
            }
            await job.retry();
            this.logger.log(`Retrying job ${jobId} from queue ${queueName}`);
        }
        /**
         * Supprime un job échoué
         */
        async removeJob(queueName, jobId) {
            const queue = this.getQueues().get(queueName);
            if (!queue) {
                throw new Error(`Queue ${queueName} not found`);
            }
            const job = await queue.getJob(jobId);
            if (!job) {
                throw new Error(`Job ${jobId} not found in queue ${queueName}`);
            }
            await job.remove();
            this.logger.log(`Removed job ${jobId} from queue ${queueName}`);
        }
        /**
         * Nettoie les anciens jobs échoués
         */
        async cleanupOldFailedJobs(queueName, olderThanDays = 30) {
            const queue = this.getQueues().get(queueName);
            if (!queue) {
                throw new Error(`Queue ${queueName} not found`);
            }
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const failed = await queue.getFailed(0, 999);
            let removed = 0;
            for (const job of failed) {
                if (job.timestamp && new Date(job.timestamp) < cutoffDate) {
                    await job.remove();
                    removed++;
                }
            }
            this.logger.log(`Cleaned up ${removed} old failed jobs from queue ${queueName}`);
            return removed;
        }
    };
    __setFunctionName(_classThis, "DLQService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DLQService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DLQService = _classThis;
})();
exports.DLQService = DLQService;
