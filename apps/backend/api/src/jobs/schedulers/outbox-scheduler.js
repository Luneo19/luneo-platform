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
exports.OutboxScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
/**
 * Scheduler pour publier les événements de l'outbox
 *
 * Exécute toutes les 10 secondes pour traiter les événements en attente
 */
let OutboxScheduler = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _publishOutboxEvents_decorators;
    let _cleanupOldEvents_decorators;
    var OutboxScheduler = _classThis = class {
        constructor(outboxQueue) {
            this.outboxQueue = (__runInitializers(this, _instanceExtraInitializers), outboxQueue);
            this.logger = new common_1.Logger(OutboxScheduler.name);
        }
        /**
         * Publie les événements de l'outbox toutes les 10 secondes
         */
        async publishOutboxEvents() {
            try {
                // Ajouter un job pour publier les événements
                await this.outboxQueue.add('publish-events', {}, {
                    removeOnComplete: 10,
                    removeOnFail: 5,
                });
                this.logger.debug('Outbox publisher job queued');
            }
            catch (error) {
                this.logger.error('Failed to queue outbox publisher job:', error);
            }
        }
        /**
         * Nettoyage des anciens événements publiés (une fois par jour à 2h du matin)
         */
        async cleanupOldEvents() {
            try {
                // Le cleanup sera géré par OutboxService.cleanup()
                // Appelé via un job séparé si nécessaire
                this.logger.log('Outbox cleanup scheduled (to be implemented)');
            }
            catch (error) {
                this.logger.error('Failed to cleanup old outbox events:', error);
            }
        }
    };
    __setFunctionName(_classThis, "OutboxScheduler");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _publishOutboxEvents_decorators = [(0, schedule_1.Cron)('*/10 * * * * *')];
        _cleanupOldEvents_decorators = [(0, schedule_1.Cron)('0 2 * * *')];
        __esDecorate(_classThis, null, _publishOutboxEvents_decorators, { kind: "method", name: "publishOutboxEvents", static: false, private: false, access: { has: obj => "publishOutboxEvents" in obj, get: obj => obj.publishOutboxEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cleanupOldEvents_decorators, { kind: "method", name: "cleanupOldEvents", static: false, private: false, access: { has: obj => "cleanupOldEvents" in obj, get: obj => obj.cleanupOldEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OutboxScheduler = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OutboxScheduler = _classThis;
})();
exports.OutboxScheduler = OutboxScheduler;
