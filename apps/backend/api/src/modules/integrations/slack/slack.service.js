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
exports.SlackService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let SlackService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SlackService = _classThis = class {
        constructor(httpService) {
            this.httpService = httpService;
            this.logger = new common_1.Logger(SlackService.name);
        }
        /**
         * Test Slack connection
         */
        async testConnection(config) {
            try {
                if (!config.webhookUrl) {
                    return {
                        success: false,
                        message: 'Slack webhook URL is required',
                    };
                }
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(config.webhookUrl, {
                    text: '🎉 Luneo Enterprise - Test de connexion Slack réussi !',
                    attachments: [{
                            color: '#4CAF50',
                            title: 'Test de Connexion',
                            text: 'Votre intégration Slack est correctement configurée.',
                            footer: 'Luneo Enterprise',
                            ts: Math.floor(Date.now() / 1000),
                        }],
                }));
                return {
                    success: response.status === 200,
                    message: 'Slack connection successful',
                };
            }
            catch (error) {
                this.logger.error('Slack test failed:', error);
                return {
                    success: false,
                    message: error.message || 'Failed to connect to Slack',
                };
            }
        }
        /**
         * Send message to Slack
         */
        async sendMessage(config, event, data) {
            try {
                if (!config.webhookUrl || !config.enabled) {
                    return;
                }
                const message = this.formatMessage(event, data);
                await (0, rxjs_1.firstValueFrom)(this.httpService.post(config.webhookUrl, message, {
                    timeout: 5000,
                }));
                this.logger.log(`Slack notification sent for event: ${event}`);
            }
            catch (error) {
                this.logger.error(`Failed to send Slack message for event ${event}:`, error);
                throw error;
            }
        }
        /**
         * Format message for Slack
         */
        formatMessage(event, data) {
            const eventConfig = {
                'design.created': {
                    color: '#2196F3',
                    title: '🎨 Nouveau Design Créé',
                    emoji: ':art:',
                },
                'design.completed': {
                    color: '#4CAF50',
                    title: '✅ Design Terminé',
                    emoji: ':white_check_mark:',
                },
                'order.created': {
                    color: '#FF9800',
                    title: '🛒 Nouvelle Commande',
                    emoji: ':shopping_cart:',
                },
                'order.paid': {
                    color: '#4CAF50',
                    title: '💰 Paiement Reçu',
                    emoji: ':moneybag:',
                },
            };
            const config = eventConfig[event] || {
                color: '#9E9E9E',
                title: `📢 ${event}`,
                emoji: ':bell:',
            };
            return {
                text: `${config.emoji} ${config.title}`,
                attachments: [{
                        color: config.color,
                        title: config.title,
                        fields: Object.entries(data).map(([key, value]) => ({
                            title: this.formatFieldName(key),
                            value: String(value),
                            short: true,
                        })),
                        footer: 'Luneo Enterprise',
                        ts: Math.floor(Date.now() / 1000),
                    }],
            };
        }
        formatFieldName(key) {
            return key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        }
    };
    __setFunctionName(_classThis, "SlackService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SlackService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SlackService = _classThis;
})();
exports.SlackService = SlackService;
