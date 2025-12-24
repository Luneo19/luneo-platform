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
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
let WebhookService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WebhookService = _classThis = class {
        constructor(prisma, cache, httpService) {
            this.prisma = prisma;
            this.cache = cache;
            this.httpService = httpService;
            this.logger = new common_1.Logger(WebhookService.name);
        }
        /**
         * Send webhook to brand's webhook URL
         */
        async sendWebhook(event, data, brandId) {
            try {
                // Get brand webhook configuration
                const brand = await this.prisma.brand.findUnique({
                    where: { id: brandId || global.currentBrandId },
                    select: {
                        id: true,
                        name: true,
                        webhookUrl: true,
                        webhookSecret: true,
                    },
                });
                if (!brand || !brand.webhookUrl) {
                    this.logger.warn(`No webhook URL configured for brand ${brandId}`);
                    return { success: false, error: 'No webhook URL configured' };
                }
                // Prepare webhook payload
                const payload = {
                    event,
                    data,
                    timestamp: new Date().toISOString(),
                    brandId: brand.id,
                    brandName: brand.name,
                };
                // Generate signature if secret is configured
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Luneo-Webhook/1.0',
                };
                if (brand.webhookSecret) {
                    const signature = this.generateSignature(JSON.stringify(payload), brand.webhookSecret);
                    headers['X-Luneo-Signature'] = signature;
                }
                // Send webhook
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(brand.webhookUrl, payload, {
                    headers,
                    timeout: 10000, // 10 seconds timeout
                }));
                this.logger.log(`Webhook sent successfully to ${brand.webhookUrl} for event ${event}`);
                // Store webhook delivery record
                await this.storeWebhookDelivery(brand.id, event, payload, response.status, null);
                return { success: true, statusCode: response.status };
            }
            catch (error) {
                this.logger.error(`Failed to send webhook for event ${event}:`, error);
                // Store failed webhook delivery
                await this.storeWebhookDelivery(brandId || global.currentBrandId, event, data, null, error.message);
                return {
                    success: false,
                    statusCode: error.response?.status,
                    error: error.message,
                };
            }
        }
        /**
         * Test webhook endpoint
         */
        async testWebhook(brandId, webhookUrl, secret) {
            try {
                const testPayload = {
                    event: 'test',
                    data: {
                        message: 'This is a test webhook from Luneo',
                        timestamp: new Date().toISOString(),
                    },
                    timestamp: new Date().toISOString(),
                    brandId,
                };
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Luneo-Webhook/1.0',
                };
                if (secret) {
                    const signature = this.generateSignature(JSON.stringify(testPayload), secret);
                    headers['X-Luneo-Signature'] = signature;
                }
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(webhookUrl, testPayload, {
                    headers,
                    timeout: 10000,
                }));
                return { success: true, statusCode: response.status };
            }
            catch (error) {
                return {
                    success: false,
                    statusCode: error.response?.status,
                    error: error.message,
                };
            }
        }
        /**
         * Get webhook delivery history
         */
        async getWebhookHistory(brandId, page = 1, limit = 20) {
            const skip = (page - 1) * limit;
            const [webhooks, total] = await Promise.all([
                this.prisma.webhook.findMany({
                    where: { brandId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        event: true,
                        url: true,
                        statusCode: true,
                        success: true,
                        error: true,
                        createdAt: true,
                    },
                }),
                this.prisma.webhook.count({ where: { brandId } }),
            ]);
            return {
                data: webhooks,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        /**
         * Retry failed webhook
         */
        async retryWebhook(webhookId) {
            try {
                const webhook = await this.prisma.webhook.findUnique({
                    where: { id: webhookId },
                    include: { brand: true },
                });
                if (!webhook) {
                    throw new common_1.BadRequestException('Webhook not found');
                }
                if (webhook.success) {
                    throw new common_1.BadRequestException('Webhook was already successful');
                }
                // Resend webhook
                const result = await this.sendWebhook(webhook.event, webhook.payload, webhook.brandId);
                return { success: result.success, error: result.error };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        }
        /**
         * Generate webhook signature
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
            const expectedSignature = this.generateSignature(payload, secret);
            return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
        }
        /**
         * Store webhook delivery record
         */
        async storeWebhookDelivery(brandId, event, payload, statusCode, error) {
            try {
                await this.prisma.webhook.create({
                    data: {
                        event,
                        url: (await this.prisma.brand.findUnique({ where: { id: brandId } }))?.webhookUrl || '',
                        payload,
                        statusCode,
                        success: statusCode !== null && statusCode >= 200 && statusCode < 300,
                        error,
                        brandId,
                    },
                });
            }
            catch (error) {
                this.logger.error('Failed to store webhook delivery record:', error);
            }
        }
    };
    __setFunctionName(_classThis, "WebhookService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhookService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhookService = _classThis;
})();
exports.WebhookService = WebhookService;
