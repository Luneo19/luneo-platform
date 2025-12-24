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
exports.WebhookHandlerService = void 0;
const common_1 = require("@nestjs/common");
let WebhookHandlerService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WebhookHandlerService = _classThis = class {
        constructor(webhookQueue, prisma, shopifyConnector, woocommerceConnector) {
            this.webhookQueue = webhookQueue;
            this.prisma = prisma;
            this.shopifyConnector = shopifyConnector;
            this.woocommerceConnector = woocommerceConnector;
            this.logger = new common_1.Logger(WebhookHandlerService.name);
        }
        /**
         * Traite un webhook Shopify
         */
        async handleShopifyWebhook(topic, shop, payload, hmacHeader) {
            try {
                // Récupérer l'intégration
                const integration = await this.prisma.ecommerceIntegration.findFirst({
                    where: {
                        platform: 'shopify',
                        shopDomain: shop,
                        status: 'active',
                    },
                });
                if (!integration) {
                    this.logger.warn(`No active Shopify integration found for shop: ${shop}`);
                    return;
                }
                // Valider le webhook
                const webhookSecret = integration.config.webhookSecret || '';
                const isValid = this.shopifyConnector.validateWebhook(JSON.stringify(payload), hmacHeader, webhookSecret);
                if (!isValid) {
                    throw new Error('Invalid webhook signature');
                }
                // Log du webhook
                await this.logWebhook({
                    id: `shopify_${Date.now()}`,
                    topic,
                    shop_domain: shop,
                    payload,
                    created_at: new Date().toISOString(),
                });
                // Traiter de manière asynchrone
                await this.webhookQueue.add('process-shopify-webhook', {
                    integrationId: integration.id,
                    topic,
                    shop,
                    payload,
                });
                this.logger.log(`Shopify webhook queued: ${topic} for shop ${shop}`);
            }
            catch (error) {
                this.logger.error(`Error handling Shopify webhook:`, error);
                throw error;
            }
        }
        /**
         * Traite un webhook WooCommerce
         */
        async handleWooCommerceWebhook(topic, payload, signature) {
            try {
                // Trouver l'intégration
                const integration = await this.prisma.ecommerceIntegration.findFirst({
                    where: {
                        platform: 'woocommerce',
                        status: 'active',
                    },
                });
                if (!integration) {
                    this.logger.warn(`No active WooCommerce integration found`);
                    return;
                }
                // Log du webhook
                await this.logWebhook({
                    id: `woocommerce_${Date.now()}`,
                    topic,
                    payload,
                    created_at: new Date().toISOString(),
                });
                // Traiter de manière asynchrone
                await this.webhookQueue.add('process-woocommerce-webhook', {
                    integrationId: integration.id,
                    topic,
                    payload,
                    signature,
                });
                this.logger.log(`WooCommerce webhook queued: ${topic}`);
            }
            catch (error) {
                this.logger.error(`Error handling WooCommerce webhook:`, error);
                throw error;
            }
        }
        /**
         * Log un webhook
         */
        async logWebhook(webhook) {
            try {
                await this.prisma.webhookLog.create({
                    data: {
                        webhookId: webhook.id,
                        topic: webhook.topic,
                        shopDomain: webhook.shop_domain,
                        payload: webhook.payload,
                        status: 'received',
                        createdAt: new Date(webhook.created_at),
                    },
                });
            }
            catch (error) {
                this.logger.error(`Error logging webhook:`, error);
            }
        }
        /**
         * Récupère l'historique des webhooks
         */
        async getWebhookHistory(integrationId, limit = 50) {
            try {
                const integration = await this.prisma.ecommerceIntegration.findUnique({
                    where: { id: integrationId },
                });
                if (!integration) {
                    throw new Error(`Integration ${integrationId} not found`);
                }
                const webhooks = await this.prisma.webhookLog.findMany({
                    where: {
                        shopDomain: integration.shopDomain,
                    },
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                });
                return webhooks;
            }
            catch (error) {
                this.logger.error(`Error fetching webhook history:`, error);
                throw error;
            }
        }
        /**
         * Réessaye un webhook échoué
         */
        async retryWebhook(webhookId) {
            try {
                const webhook = await this.prisma.webhookLog.findUnique({
                    where: { id: webhookId },
                });
                if (!webhook) {
                    throw new Error(`Webhook ${webhookId} not found`);
                }
                const integration = await this.prisma.ecommerceIntegration.findFirst({
                    where: {
                        shopDomain: webhook.shopDomain,
                        status: 'active',
                    },
                });
                if (!integration) {
                    throw new Error('No active integration found for webhook');
                }
                // Réessayer selon la plateforme
                if (integration.platform === 'shopify') {
                    await this.shopifyConnector.handleWebhook(webhook.topic, webhook.shopDomain, webhook.payload);
                }
                else if (integration.platform === 'woocommerce') {
                    await this.woocommerceConnector.handleWebhook(webhook.topic, webhook.payload, '');
                }
                // Mettre à jour le statut
                await this.prisma.webhookLog.update({
                    where: { id: webhookId },
                    data: { status: 'retried' },
                });
                this.logger.log(`Webhook ${webhookId} retried successfully`);
            }
            catch (error) {
                this.logger.error(`Error retrying webhook ${webhookId}:`, error);
                throw error;
            }
        }
        /**
         * Obtient les statistiques des webhooks
         */
        async getWebhookStats(integrationId, period = 'week') {
            try {
                const integration = await this.prisma.ecommerceIntegration.findUnique({
                    where: { id: integrationId },
                });
                if (!integration) {
                    throw new Error(`Integration ${integrationId} not found`);
                }
                const now = new Date();
                const startDate = new Date();
                switch (period) {
                    case 'day':
                        startDate.setDate(now.getDate() - 1);
                        break;
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                }
                const webhooks = await this.prisma.webhookLog.findMany({
                    where: {
                        shopDomain: integration.shopDomain,
                        createdAt: {
                            gte: startDate,
                            lte: now,
                        },
                    },
                });
                const stats = {
                    period,
                    totalWebhooks: webhooks.length,
                    webhooksByTopic: webhooks.reduce((acc, webhook) => {
                        acc[webhook.topic] = (acc[webhook.topic] || 0) + 1;
                        return acc;
                    }, {}),
                    webhooksByStatus: webhooks.reduce((acc, webhook) => {
                        acc[webhook.status] = (acc[webhook.status] || 0) + 1;
                        return acc;
                    }, {}),
                    successRate: webhooks.length > 0
                        ? (webhooks.filter(w => w.status === 'processed').length / webhooks.length) * 100
                        : 0,
                };
                return stats;
            }
            catch (error) {
                this.logger.error(`Error getting webhook stats:`, error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "WebhookHandlerService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhookHandlerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhookHandlerService = _classThis;
})();
exports.WebhookHandlerService = WebhookHandlerService;
