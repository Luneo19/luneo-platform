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
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let WebhooksService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WebhooksService = _classThis = class {
        constructor(prisma) {
            this.prisma = prisma;
            this.logger = new common_1.Logger(WebhooksService.name);
        }
        /**
         * Génère une clé d'idempotency à partir du payload
         */
        generateIdempotencyKey(payload, brandId) {
            const payloadStr = JSON.stringify(payload);
            const hash = (0, crypto_1.createHash)('sha256').update(`${brandId}:${payloadStr}`).digest('hex');
            return hash.substring(0, 32);
        }
        /**
         * Valide l'idempotency et le timestamp (replay protection)
         */
        async validateWebhook(idempotencyKey, timestamp, maxAgeMinutes = 5) {
            // Vérifier si déjà traité
            const existing = await this.prisma.webhook.findFirst({
                where: { idempotencyKey: idempotencyKey || undefined },
            });
            if (existing) {
                this.logger.debug(`Webhook already processed: ${idempotencyKey}`);
                return { isValid: true, existing };
            }
            // Vérifier timestamp (replay protection)
            const now = Date.now();
            const age = Math.abs(now - timestamp);
            const maxAge = maxAgeMinutes * 60 * 1000;
            if (age > maxAge) {
                throw new common_1.BadRequestException(`Webhook timestamp too old: ${age}ms > ${maxAge}ms. Possible replay attack.`);
            }
            return { isValid: true };
        }
        /**
         * Traite un webhook avec idempotency
         */
        async processWebhook(brandId, event, payload, idempotencyKey, timestamp) {
            // Générer idempotency key si non fourni
            const key = idempotencyKey || this.generateIdempotencyKey(payload, brandId);
            const ts = timestamp || Date.now();
            // Valider idempotency
            const validation = await this.validateWebhook(key, ts);
            if (validation.existing) {
                return validation.existing; // Déjà traité
            }
            // Traiter le webhook
            try {
                const result = await this.processSendGridEvent(payload);
                // Enregistrer avec idempotency key
                await this.prisma.webhook.create({
                    data: {
                        brandId,
                        event,
                        url: '', // Pas d'URL pour webhooks entrants
                        payload: payload,
                        success: true,
                        idempotencyKey: key || undefined,
                        timestamp: new Date(ts),
                    },
                });
                return result;
            }
            catch (error) {
                // Enregistrer l'échec
                await this.prisma.webhook.create({
                    data: {
                        brandId,
                        event,
                        url: '',
                        payload: payload,
                        success: false,
                        error: error.message,
                        idempotencyKey: key || undefined,
                        timestamp: new Date(ts),
                    },
                });
                throw error;
            }
        }
        async processSendGridEvent(event) {
            this.logger.log(`Traitement de l'événement SendGrid: ${event.event} pour ${event.email}`);
            // Ici vous pouvez ajouter votre logique métier
            // Par exemple: mise à jour de la base de données, notifications, etc.
            return { success: true, event: event.event, email: event.email };
        }
        async logWebhookEvent(event) {
            this.logger.debug('Événement webhook loggé:', JSON.stringify(event, null, 2));
        }
    };
    __setFunctionName(_classThis, "WebhooksService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhooksService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhooksService = _classThis;
})();
exports.WebhooksService = WebhooksService;
