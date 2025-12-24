"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZapierService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
let ZapierService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ZapierService = _classThis = class {
        constructor(httpService) {
            this.httpService = httpService;
            this.logger = new common_1.Logger(ZapierService.name);
        }
        /**
         * Test Zapier webhook
         */
        async testWebhook(config) {
            try {
                if (!config.webhookUrl) {
                    return {
                        success: false,
                        message: 'Zapier webhook URL is required',
                    };
                }
                const testPayload = {
                    event: 'test',
                    timestamp: new Date().toISOString(),
                    data: {
                        message: 'Test de connexion Zapier depuis Luneo Enterprise',
                        status: 'success',
                    },
                };
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(config.webhookUrl, testPayload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Luneo-Zapier/1.0',
                    },
                    timeout: 5000,
                }));
                return {
                    success: response.status === 200,
                    message: 'Zapier webhook connection successful',
                };
            }
            catch (error) {
                this.logger.error('Zapier test failed:', error);
                return {
                    success: false,
                    message: error.message || 'Failed to connect to Zapier',
                };
            }
        }
        /**
         * Trigger Zapier Zap
         */
        async triggerZap(config, event, data) {
            try {
                if (!config.webhookUrl || !config.enabled) {
                    return;
                }
                const payload = {
                    event,
                    timestamp: new Date().toISOString(),
                    data: this.transformDataForZapier(event, data),
                };
                // Add signature if secret is configured
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Luneo-Zapier/1.0',
                };
                if (config.secret) {
                    headers['X-Luneo-Signature'] = this.generateSignature(JSON.stringify(payload), config.secret);
                }
                await (0, rxjs_1.firstValueFrom)(this.httpService.post(config.webhookUrl, payload, {
                    headers,
                    timeout: 10000,
                }));
                this.logger.log(`Zapier zap triggered for event: ${event}`);
            }
            catch (error) {
                this.logger.error(`Failed to trigger Zapier zap for event ${event}:`, error);
                throw error;
            }
        }
        /**
         * Transform data for Zapier format
         */
        transformDataForZapier(event, data) {
            // Zapier prefers flat structures
            const flatData = {};
            const flatten = (obj, prefix = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    const newKey = prefix ? `${prefix}_${key}` : key;
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        flatten(value, newKey);
                    }
                    else {
                        flatData[newKey] = value;
                    }
                }
            };
            flatten(data);
            return flatData;
        }
        /**
         * Generate HMAC signature for webhook verification
         */
        generateSignature(payload, secret) {
            return crypto
                .createHmac('sha256', secret)
                .update(payload)
                .digest('hex');
        }
        /**
         * Register Zapier triggers
         */
        async getAvailableTriggers() {
            return [
                {
                    key: 'design.created',
                    name: 'Nouveau Design Créé',
                    description: 'Déclenché lorsqu\'un nouveau design est créé',
                },
                {
                    key: 'design.completed',
                    name: 'Design Terminé',
                    description: 'Déclenché lorsqu\'un design est complété par l\'IA',
                },
                {
                    key: 'order.created',
                    name: 'Nouvelle Commande',
                    description: 'Déclenché lorsqu\'une nouvelle commande est créée',
                },
                {
                    key: 'order.paid',
                    name: 'Paiement Reçu',
                    description: 'Déclenché lorsqu\'un paiement est confirmé',
                },
                {
                    key: 'user.registered',
                    name: 'Nouvel Utilisateur',
                    description: 'Déclenché lors de l\'inscription d\'un nouvel utilisateur',
                },
            ];
        }
    };
    __setFunctionName(_classThis, "ZapierService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ZapierService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ZapierService = _classThis;
})();
exports.ZapierService = ZapierService;
