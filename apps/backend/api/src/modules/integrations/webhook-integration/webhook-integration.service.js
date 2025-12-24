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
exports.WebhookIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
let WebhookIntegrationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WebhookIntegrationService = _classThis = class {
        constructor(httpService) {
            this.httpService = httpService;
            this.logger = new common_1.Logger(WebhookIntegrationService.name);
        }
        /**
         * Test webhook endpoint
         */
        async testEndpoint(config) {
            try {
                if (!config.url) {
                    return {
                        success: false,
                        message: 'Webhook URL is required',
                    };
                }
                const testPayload = {
                    event: 'webhook.test',
                    timestamp: new Date().toISOString(),
                    data: {
                        message: 'Test webhook from Luneo Enterprise',
                        status: 'success',
                    },
                };
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Luneo-Webhook/1.0',
                    'X-Luneo-Event': 'webhook.test',
                };
                if (config.secret) {
                    headers['X-Luneo-Signature'] = this.generateSignature(JSON.stringify(testPayload), config.secret);
                }
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(config.url, testPayload, {
                    headers,
                    timeout: 5000,
                }));
                return {
                    success: response.status >= 200 && response.status < 300,
                    message: `Webhook endpoint responded with status ${response.status}`,
                };
            }
            catch (error) {
                this.logger.error('Webhook test failed:', error);
                return {
                    success: false,
                    message: error.response?.status
                        ? `Endpoint returned ${error.response.status}`
                        : error.message || 'Failed to connect to webhook endpoint',
                };
            }
        }
        /**
         * Send webhook
         */
        async sendWebhook(config, event, data) {
            try {
                if (!config.url || !config.enabled) {
                    return;
                }
                const payload = {
                    event,
                    timestamp: new Date().toISOString(),
                    data,
                };
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Luneo-Webhook/1.0',
                    'X-Luneo-Event': event,
                };
                if (config.secret) {
                    headers['X-Luneo-Signature'] = this.generateSignature(JSON.stringify(payload), config.secret);
                }
                await (0, rxjs_1.firstValueFrom)(this.httpService.post(config.url, payload, {
                    headers,
                    timeout: 10000,
                }));
                this.logger.log(`Webhook sent successfully for event: ${event}`);
            }
            catch (error) {
                this.logger.error(`Failed to send webhook for event ${event}:`, error);
                // In a production environment, you might want to:
                // 1. Retry with exponential backoff
                // 2. Store failed webhooks for later retry
                // 3. Alert administrators
                throw error;
            }
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
         * Verify webhook signature
         */
        verifySignature(payload, signature, secret) {
            try {
                const expectedSignature = this.generateSignature(payload, secret);
                return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
            }
            catch (error) {
                this.logger.error('Signature verification failed:', error);
                return false;
            }
        }
        /**
         * Get webhook delivery statistics
         */
        async getDeliveryStats(brandId) {
            // In a real implementation, this would query webhook delivery logs
            // For now, return mock data
            return {
                total: 0,
                successful: 0,
                failed: 0,
                successRate: 0,
            };
        }
    };
    __setFunctionName(_classThis, "WebhookIntegrationService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhookIntegrationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhookIntegrationService = _classThis;
})();
exports.WebhookIntegrationService = WebhookIntegrationService;
