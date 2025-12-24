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
exports.ObservabilityScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
let ObservabilityScheduler = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _evaluateSLOs_decorators;
    let _createDailyBackup_decorators;
    let _cleanupOldBackups_decorators;
    var ObservabilityScheduler = _classThis = class {
        constructor(sloService, drService) {
            this.sloService = (__runInitializers(this, _instanceExtraInitializers), sloService);
            this.drService = drService;
            this.logger = new common_1.Logger(ObservabilityScheduler.name);
        }
        /**
         * Évalue tous les SLO (toutes les heures)
         */
        async evaluateSLOs() {
            this.logger.log('Evaluating all SLOs...');
            try {
                const results = await this.sloService.evaluateAllSLOs();
                await this.sloService.saveSLOResults(results);
                const breaches = results.filter((r) => r.status === 'breach');
                if (breaches.length > 0) {
                    this.logger.error(`SLO breaches detected: ${breaches.length}`, breaches);
                }
                this.logger.log(`SLO evaluation completed: ${results.length} SLOs evaluated`);
            }
            catch (error) {
                this.logger.error('Failed to evaluate SLOs:', error);
            }
        }
        /**
         * Crée un backup de la base de données (tous les jours à 2h du matin)
         */
        async createDailyBackup() {
            this.logger.log('Creating daily database backup...');
            try {
                const backup = await this.drService.createDatabaseBackup();
                this.logger.log(`Daily backup created: ${backup.id}`);
            }
            catch (error) {
                this.logger.error('Failed to create daily backup:', error);
            }
        }
        /**
         * Nettoie les anciens backups (tous les dimanches à 3h du matin)
         */
        async cleanupOldBackups() {
            this.logger.log('Cleaning up old backups...');
            try {
                const deletedCount = await this.drService.cleanupOldBackups(30); // 30 jours retention
                this.logger.log(`Cleaned up ${deletedCount} old backups`);
            }
            catch (error) {
                this.logger.error('Failed to cleanup old backups:', error);
            }
        }
    };
    __setFunctionName(_classThis, "ObservabilityScheduler");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _evaluateSLOs_decorators = [(0, schedule_1.Cron)('0 * * * *')];
        _createDailyBackup_decorators = [(0, schedule_1.Cron)('0 2 * * *')];
        _cleanupOldBackups_decorators = [(0, schedule_1.Cron)('0 3 * * 0')];
        __esDecorate(_classThis, null, _evaluateSLOs_decorators, { kind: "method", name: "evaluateSLOs", static: false, private: false, access: { has: obj => "evaluateSLOs" in obj, get: obj => obj.evaluateSLOs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createDailyBackup_decorators, { kind: "method", name: "createDailyBackup", static: false, private: false, access: { has: obj => "createDailyBackup" in obj, get: obj => obj.createDailyBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cleanupOldBackups_decorators, { kind: "method", name: "cleanupOldBackups", static: false, private: false, access: { has: obj => "cleanupOldBackups" in obj, get: obj => obj.cleanupOldBackups }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ObservabilityScheduler = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ObservabilityScheduler = _classThis;
})();
exports.ObservabilityScheduler = ObservabilityScheduler;
