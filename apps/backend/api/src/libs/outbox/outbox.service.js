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
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
let OutboxService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OutboxService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(OutboxService.name);
        }
        /**
         * Publie un événement dans l'outbox (transaction-safe)
         */
        async publish(eventType, payload) {
            try {
                const event = await this.prisma.outboxEvent.create({
                    data: {
                        eventType,
                        payload: payload,
                        status: 'pending',
                    },
                });
                this.logger.debug(`Event published to outbox: ${eventType} (${event.id})`);
                return event.id;
            }
            catch (error) {
                this.logger.error(`Failed to publish event to outbox: ${eventType}`, error);
                throw error;
            }
        }
        /**
         * Récupère les événements en attente de publication
         */
        async getPendingEvents(limit = 100) {
            return this.prisma.outboxEvent.findMany({
                where: {
                    status: 'pending',
                },
                orderBy: {
                    createdAt: 'asc',
                },
                take: limit,
            });
        }
        /**
         * Marque un événement comme publié
         */
        async markAsPublished(eventId) {
            await this.prisma.outboxEvent.update({
                where: { id: eventId },
                data: {
                    status: 'published',
                    publishedAt: new Date(),
                },
            });
        }
        /**
         * Marque un événement comme échoué
         */
        async markAsFailed(eventId, error) {
            await this.prisma.outboxEvent.update({
                where: { id: eventId },
                data: {
                    status: 'failed',
                    attempts: { increment: 1 },
                    payload: {
                        ...((await this.prisma.outboxEvent.findUnique({ where: { id: eventId } }))?.payload || {}),
                        error: error || 'Unknown error',
                    },
                },
            });
        }
        /**
         * Réessaye un événement échoué
         */
        async retry(eventId) {
            await this.prisma.outboxEvent.update({
                where: { id: eventId },
                data: {
                    status: 'pending',
                    attempts: { increment: 1 },
                },
            });
        }
        /**
         * Nettoie les anciens événements publiés (retention policy)
         */
        async cleanup(olderThanDays = 30) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const result = await this.prisma.outboxEvent.deleteMany({
                where: {
                    status: 'published',
                    publishedAt: {
                        lt: cutoffDate,
                    },
                },
            });
            this.logger.log(`Cleaned up ${result.count} old outbox events`);
            return result.count;
        }
    };
    __setFunctionName(_classThis, "OutboxService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OutboxService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OutboxService = _classThis;
})();
exports.OutboxService = OutboxService;
