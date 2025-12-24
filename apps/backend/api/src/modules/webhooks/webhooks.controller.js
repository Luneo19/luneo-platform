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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
let WebhooksController = (() => {
    let _classDecorators = [(0, common_1.Controller)('webhooks')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _handleSendGridWebhook_decorators;
    var WebhooksController = _classThis = class {
        constructor(webhooksService) {
            this.webhooksService = (__runInitializers(this, _instanceExtraInitializers), webhooksService);
            this.logger = new common_1.Logger(WebhooksController.name);
        }
        async handleSendGridWebhook(events, headers) {
            this.logger.log('📧 Webhook SendGrid reçu');
            this.logger.log(`Nombre d'événements: ${events.length}`);
            // Log des headers pour debug
            this.logger.debug('Headers reçus:', {
                'user-agent': headers['user-agent'],
                'content-type': headers['content-type'],
                'content-length': headers['content-length']
            });
            try {
                // Traiter chaque événement
                for (const event of events) {
                    await this.processSendGridEvent(event);
                }
                // Log du payload complet pour debug
                this.logger.debug('Payload SendGrid reçu:', JSON.stringify(events, null, 2));
                return { status: 'success', message: 'Webhook traité avec succès', events_processed: events.length };
            }
            catch (error) {
                this.logger.error('Erreur lors du traitement du webhook SendGrid:', error);
                throw error;
            }
        }
        async processSendGridEvent(event) {
            const { email, event: eventType, timestamp, reason, 'smtp-id': smtpId } = event;
            this.logger.log(`📊 Événement SendGrid: ${eventType} pour ${email}`);
            switch (eventType) {
                case 'delivered':
                    await this.handleDeliveredEvent(event);
                    break;
                case 'bounce':
                    await this.handleBounceEvent(event);
                    break;
                case 'dropped':
                    await this.handleDroppedEvent(event);
                    break;
                case 'spam_report':
                    await this.handleSpamReportEvent(event);
                    break;
                case 'unsubscribe':
                    await this.handleUnsubscribeEvent(event);
                    break;
                case 'group_unsubscribe':
                    await this.handleGroupUnsubscribeEvent(event);
                    break;
                case 'processed':
                    await this.handleProcessedEvent(event);
                    break;
                case 'deferred':
                    await this.handleDeferredEvent(event);
                    break;
                default:
                    this.logger.warn(`Événement SendGrid non géré: ${eventType}`);
            }
        }
        async handleDeliveredEvent(event) {
            this.logger.log(`✅ Email livré: ${event.email} (${event['smtp-id']})`);
            // Ici vous pouvez mettre à jour votre base de données
            // Par exemple: marquer l'email comme livré
        }
        async handleBounceEvent(event) {
            this.logger.warn(`❌ Email en bounce: ${event.email} - Raison: ${event.reason}`);
            // Ici vous pouvez:
            // - Marquer l'email comme invalide
            // - Notifier l'équipe
            // - Mettre à jour la liste de suppression
        }
        async handleDroppedEvent(event) {
            this.logger.warn(`🚫 Email supprimé: ${event.email} - Raison: ${event.reason}`);
            // Ici vous pouvez:
            // - Analyser pourquoi l'email a été supprimé
            // - Mettre à jour vos listes de suppression
        }
        async handleSpamReportEvent(event) {
            this.logger.warn(`🚨 Email marqué comme spam: ${event.email}`);
            // Ici vous pouvez:
            // - Ajouter l'email à la liste de suppression
            // - Analyser le contenu de l'email
            // - Notifier l'équipe marketing
        }
        async handleUnsubscribeEvent(event) {
            this.logger.log(`📤 Désabonnement: ${event.email}`);
            // Ici vous pouvez:
            // - Mettre à jour les préférences utilisateur
            // - Marquer comme désabonné dans votre DB
        }
        async handleGroupUnsubscribeEvent(event) {
            this.logger.log(`📤 Désabonnement groupe: ${event.email}`);
            // Ici vous pouvez:
            // - Mettre à jour les préférences de groupe
        }
        async handleProcessedEvent(event) {
            this.logger.log(`⚙️ Email traité: ${event.email}`);
            // Ici vous pouvez:
            // - Marquer comme en cours de traitement
        }
        async handleDeferredEvent(event) {
            this.logger.log(`⏳ Email différé: ${event.email} - Raison: ${event.reason}`);
            // Ici vous pouvez:
            // - Marquer pour retry
            // - Surveiller les tentatives
        }
    };
    __setFunctionName(_classThis, "WebhooksController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleSendGridWebhook_decorators = [(0, common_1.Post)('sendgrid'), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        __esDecorate(_classThis, null, _handleSendGridWebhook_decorators, { kind: "method", name: "handleSendGridWebhook", static: false, private: false, access: { has: obj => "handleSendGridWebhook" in obj, get: obj => obj.handleSendGridWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhooksController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhooksController = _classThis;
})();
exports.WebhooksController = WebhooksController;
