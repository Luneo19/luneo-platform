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
exports.MarketplaceScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
let MarketplaceScheduler = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _processScheduledPayouts_decorators;
    let _evaluateAllActiveSLAs_decorators;
    var MarketplaceScheduler = _classThis = class {
        constructor(stripeConnect, slaEnforcement) {
            this.stripeConnect = (__runInitializers(this, _instanceExtraInitializers), stripeConnect);
            this.slaEnforcement = slaEnforcement;
            this.logger = new common_1.Logger(MarketplaceScheduler.name);
        }
        /**
         * Traite les payouts automatiques (tous les jours à 2h du matin)
         */
        async processScheduledPayouts() {
            this.logger.log('Processing scheduled payouts...');
            try {
                await this.stripeConnect.processScheduledPayouts();
                this.logger.log('Scheduled payouts processed successfully');
            }
            catch (error) {
                this.logger.error('Failed to process scheduled payouts:', error);
            }
        }
        /**
         * Évalue tous les SLA actifs (toutes les heures)
         */
        async evaluateAllActiveSLAs() {
            this.logger.log('Evaluating all active SLAs...');
            try {
                await this.slaEnforcement.evaluateAllActiveSLAs();
                this.logger.log('Active SLAs evaluated successfully');
            }
            catch (error) {
                this.logger.error('Failed to evaluate active SLAs:', error);
            }
        }
    };
    __setFunctionName(_classThis, "MarketplaceScheduler");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _processScheduledPayouts_decorators = [(0, schedule_1.Cron)('0 2 * * *')];
        _evaluateAllActiveSLAs_decorators = [(0, schedule_1.Cron)('0 * * * *')];
        __esDecorate(_classThis, null, _processScheduledPayouts_decorators, { kind: "method", name: "processScheduledPayouts", static: false, private: false, access: { has: obj => "processScheduledPayouts" in obj, get: obj => obj.processScheduledPayouts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _evaluateAllActiveSLAs_decorators, { kind: "method", name: "evaluateAllActiveSLAs", static: false, private: false, access: { has: obj => "evaluateAllActiveSLAs" in obj, get: obj => obj.evaluateAllActiveSLAs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MarketplaceScheduler = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MarketplaceScheduler = _classThis;
})();
exports.MarketplaceScheduler = MarketplaceScheduler;
