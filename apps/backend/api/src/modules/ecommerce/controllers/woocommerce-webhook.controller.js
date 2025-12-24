"use strict";
/**
 * WooCommerce Webhook Controller
 * Handles incoming webhooks from WooCommerce
 */
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
exports.WooCommerceWebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crypto = __importStar(require("crypto"));
let WooCommerceWebhookController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('ecommerce'), (0, common_1.Controller)('ecommerce/woocommerce/webhook')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _handleWebhook_decorators;
    var WooCommerceWebhookController = _classThis = class {
        constructor(webhookService) {
            this.webhookService = (__runInitializers(this, _instanceExtraInitializers), webhookService);
            this.logger = new common_1.Logger(WooCommerceWebhookController.name);
        }
        /**
         * Verify WooCommerce webhook signature
         */
        verifySignature(body, signature, secret) {
            if (!secret || !signature) {
                return false;
            }
            try {
                const hash = crypto
                    .createHmac('sha256', secret)
                    .update(body)
                    .digest('base64');
                return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
            }
            catch (error) {
                this.logger.error('Error verifying webhook signature', error);
                return false;
            }
        }
        async handleWebhook(payload, signature, topic, source) {
            try {
                // Validate required headers
                if (!topic || !source) {
                    throw new common_1.BadRequestException('Missing required webhook headers');
                }
                // Get integration ID from source (format: integration_<id>)
                const integrationIdMatch = source.match(/^integration_(.+)$/);
                if (!integrationIdMatch) {
                    throw new common_1.BadRequestException('Invalid webhook source format');
                }
                const integrationId = integrationIdMatch[1];
                // Verify webhook signature
                const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
                if (webhookSecret) {
                    const bodyString = JSON.stringify(payload);
                    const isValid = this.verifySignature(bodyString, signature, webhookSecret);
                    if (!isValid) {
                        this.logger.warn('Invalid WooCommerce webhook signature', {
                            integrationId,
                            topic,
                        });
                        throw new common_1.UnauthorizedException('Invalid webhook signature');
                    }
                }
                this.logger.log(`Processing WooCommerce webhook: ${topic}`, {
                    integrationId,
                    topic,
                });
                // Route to appropriate handler
                switch (topic) {
                    case 'product.created':
                        await this.webhookService.handleProductCreate(integrationId, payload);
                        break;
                    case 'product.updated':
                        await this.webhookService.handleProductUpdate(integrationId, payload);
                        break;
                    case 'product.deleted':
                        await this.webhookService.handleProductDelete(integrationId, payload);
                        break;
                    case 'order.created':
                        await this.webhookService.handleOrderCreate(integrationId, payload);
                        break;
                    case 'order.updated':
                        await this.webhookService.handleOrderUpdate(integrationId, payload);
                        break;
                    case 'order.deleted':
                        await this.webhookService.handleOrderDelete(integrationId, payload);
                        break;
                    default:
                        this.logger.warn(`Unhandled WooCommerce webhook topic: ${topic}`, {
                            integrationId,
                        });
                }
                return { success: true, received: true };
            }
            catch (error) {
                this.logger.error('WooCommerce webhook processing error', error);
                if (error instanceof common_1.BadRequestException || error instanceof common_1.UnauthorizedException) {
                    throw error;
                }
                throw new common_1.BadRequestException('Webhook processing failed');
            }
        }
    };
    __setFunctionName(_classThis, "WooCommerceWebhookController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleWebhook_decorators = [(0, common_1.Post)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Handle WooCommerce webhook events' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' })];
        __esDecorate(_classThis, null, _handleWebhook_decorators, { kind: "method", name: "handleWebhook", static: false, private: false, access: { has: obj => "handleWebhook" in obj, get: obj => obj.handleWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WooCommerceWebhookController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WooCommerceWebhookController = _classThis;
})();
exports.WooCommerceWebhookController = WooCommerceWebhookController;
