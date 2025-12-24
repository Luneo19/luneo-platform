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
exports.WooCommerceConnector = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
let WooCommerceConnector = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var WooCommerceConnector = _classThis = class {
        constructor(httpService, configService, prisma, cache) {
            this.httpService = httpService;
            this.configService = configService;
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_1.Logger(WooCommerceConnector.name);
        }
        /**
         * Connecte une boutique WooCommerce
         */
        async connect(brandId, siteUrl, consumerKey, consumerSecret) {
            try {
                // Valider les credentials
                await this.validateCredentials(siteUrl, consumerKey, consumerSecret);
                // Créer l'intégration
                const integration = await this.prisma.ecommerceIntegration.create({
                    data: {
                        brandId,
                        platform: 'woocommerce',
                        shopDomain: siteUrl,
                        config: {
                            consumerKey: this.encryptToken(consumerKey),
                            consumerSecret: this.encryptToken(consumerSecret),
                            apiVersion: 'v3',
                        },
                        status: 'active',
                    },
                });
                // Configurer les webhooks
                await this.setupWebhooks(integration.id, siteUrl, consumerKey, consumerSecret);
                this.logger.log(`WooCommerce integration created for brand ${brandId}`);
                return integration;
            }
            catch (error) {
                this.logger.error(`Error connecting WooCommerce:`, error);
                throw error;
            }
        }
        /**
         * Valide les credentials WooCommerce
         */
        async validateCredentials(siteUrl, consumerKey, consumerSecret) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${siteUrl}/wp-json/wc/v3/system_status`, {
                    auth: {
                        username: consumerKey,
                        password: consumerSecret,
                    },
                }));
                return response.status === 200;
            }
            catch (error) {
                this.logger.error(`Invalid WooCommerce credentials:`, error);
                throw new Error('Invalid WooCommerce credentials');
            }
        }
        /**
         * Configure les webhooks WooCommerce
         */
        async setupWebhooks(integrationId, siteUrl, consumerKey, consumerSecret) {
            const webhookUrl = `${this.configService.get('app.url')}/api/ecommerce/woocommerce/webhook`;
            const topics = [
                { name: 'Product created', topic: 'product.created' },
                { name: 'Product updated', topic: 'product.updated' },
                { name: 'Product deleted', topic: 'product.deleted' },
                { name: 'Order created', topic: 'order.created' },
                { name: 'Order updated', topic: 'order.updated' },
            ];
            for (const { name, topic } of topics) {
                try {
                    await this.createWebhook(siteUrl, consumerKey, consumerSecret, {
                        name,
                        topic,
                        delivery_url: webhookUrl,
                        secret: this.generateWebhookSecret(),
                    });
                    this.logger.log(`WooCommerce webhook created: ${topic}`);
                }
                catch (error) {
                    this.logger.error(`Error creating webhook ${topic}:`, error);
                }
            }
        }
        /**
         * Crée un webhook WooCommerce
         */
        async createWebhook(siteUrl, consumerKey, consumerSecret, webhookData) {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${siteUrl}/wp-json/wc/v3/webhooks`, webhookData, {
                auth: {
                    username: consumerKey,
                    password: consumerSecret,
                },
            }));
            return response.data;
        }
        /**
         * Récupère les produits WooCommerce
         */
        async getProducts(integrationId, options) {
            const integration = await this.getIntegration(integrationId);
            const { consumerKey, consumerSecret } = this.getCredentials(integration);
            try {
                const params = new URLSearchParams();
                params.append('per_page', (options?.per_page || 100).toString());
                params.append('page', (options?.page || 1).toString());
                if (options?.status)
                    params.append('status', options.status);
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${integration.shopDomain}/wp-json/wc/v3/products?${params}`, {
                    auth: {
                        username: consumerKey,
                        password: consumerSecret,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error(`Error fetching WooCommerce products:`, error);
                throw error;
            }
        }
        /**
         * Crée ou met à jour un produit WooCommerce
         */
        async upsertProduct(integrationId, productData, externalProductId) {
            const integration = await this.getIntegration(integrationId);
            const { consumerKey, consumerSecret } = this.getCredentials(integration);
            try {
                const url = externalProductId
                    ? `${integration.shopDomain}/wp-json/wc/v3/products/${externalProductId}`
                    : `${integration.shopDomain}/wp-json/wc/v3/products`;
                const method = externalProductId ? 'put' : 'post';
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService[method](url, productData, {
                    auth: {
                        username: consumerKey,
                        password: consumerSecret,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error(`Error upserting WooCommerce product:`, error);
                throw error;
            }
        }
        /**
         * Récupère les commandes WooCommerce
         */
        async getOrders(integrationId, options) {
            const integration = await this.getIntegration(integrationId);
            const { consumerKey, consumerSecret } = this.getCredentials(integration);
            try {
                const params = new URLSearchParams();
                params.append('per_page', (options?.per_page || 100).toString());
                params.append('page', (options?.page || 1).toString());
                if (options?.status)
                    params.append('status', options.status);
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${integration.shopDomain}/wp-json/wc/v3/orders?${params}`, {
                    auth: {
                        username: consumerKey,
                        password: consumerSecret,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error(`Error fetching WooCommerce orders:`, error);
                throw error;
            }
        }
        /**
         * Met à jour le statut d'une commande WooCommerce
         */
        async updateOrderStatus(integrationId, orderId, status) {
            const integration = await this.getIntegration(integrationId);
            const { consumerKey, consumerSecret } = this.getCredentials(integration);
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.put(`${integration.shopDomain}/wp-json/wc/v3/orders/${orderId}`, { status }, {
                    auth: {
                        username: consumerKey,
                        password: consumerSecret,
                    },
                }));
                return response.data;
            }
            catch (error) {
                this.logger.error(`Error updating WooCommerce order status:`, error);
                throw error;
            }
        }
        /**
         * Traite un webhook WooCommerce
         */
        async handleWebhook(topic, payload, signature) {
            this.logger.log(`Handling WooCommerce webhook: ${topic}`);
            try {
                // Trouver l'intégration par le site URL
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
                // Valider la signature
                const isValid = this.validateWebhookSignature(JSON.stringify(payload), signature, integration.config.webhookSecret || '');
                if (!isValid) {
                    throw new Error('Invalid webhook signature');
                }
                // Traiter selon le topic
                switch (topic) {
                    case 'product.created':
                    case 'product.updated':
                        await this.handleProductWebhook(integration.id, payload);
                        break;
                    case 'product.deleted':
                        await this.handleProductDeleteWebhook(integration.id, payload);
                        break;
                    case 'order.created':
                    case 'order.updated':
                        await this.handleOrderWebhook(integration.id, payload);
                        break;
                    default:
                        this.logger.warn(`Unhandled webhook topic: ${topic}`);
                }
            }
            catch (error) {
                this.logger.error(`Error handling WooCommerce webhook:`, error);
                throw error;
            }
        }
        /**
         * Valide la signature d'un webhook
         */
        validateWebhookSignature(payload, signature, secret) {
            const hash = crypto
                .createHmac('sha256', secret)
                .update(payload, 'utf8')
                .digest('base64');
            return hash === signature;
        }
        /**
         * Traite un webhook de produit
         */
        async handleProductWebhook(integrationId, product) {
            const mapping = await this.prisma.productMapping.findFirst({
                where: {
                    integrationId,
                    externalProductId: product.id.toString(),
                },
            });
            if (mapping) {
                await this.updateLuneoProductFromWooCommerce(mapping.luneoProductId, product);
            }
            else {
                await this.createLuneoProductFromWooCommerce(integrationId, product);
            }
        }
        /**
         * Traite un webhook de suppression de produit
         */
        async handleProductDeleteWebhook(integrationId, payload) {
            const mapping = await this.prisma.productMapping.findFirst({
                where: {
                    integrationId,
                    externalProductId: payload.id.toString(),
                },
            });
            if (mapping) {
                await this.prisma.product.update({
                    where: { id: mapping.luneoProductId },
                    data: { isActive: false },
                });
            }
        }
        /**
         * Traite un webhook de commande
         */
        async handleOrderWebhook(integrationId, order) {
            const integration = await this.getIntegration(integrationId);
            for (const lineItem of order.line_items) {
                const mapping = await this.prisma.productMapping.findFirst({
                    where: {
                        integrationId,
                        externalProductId: lineItem.product_id.toString(),
                    },
                });
                if (mapping) {
                    await this.createLuneoOrder(integration, order, lineItem, mapping);
                }
            }
        }
        /**
         * Crée un produit LUNEO à partir de WooCommerce
         */
        async createLuneoProductFromWooCommerce(integrationId, wooProduct) {
            const integration = await this.getIntegration(integrationId);
            const luneoProduct = await this.prisma.product.create({
                data: {
                    brandId: integration.brandId,
                    name: wooProduct.name,
                    description: wooProduct.description,
                    sku: wooProduct.sku,
                    price: parseFloat(wooProduct.price || '0'),
                    images: wooProduct.images.map(img => img.src),
                    isActive: wooProduct.status === 'publish',
                },
            });
            await this.prisma.productMapping.create({
                data: {
                    integrationId,
                    luneoProductId: luneoProduct.id,
                    externalProductId: wooProduct.id.toString(),
                    externalSku: wooProduct.sku,
                    syncStatus: 'synced',
                    lastSyncedAt: new Date(),
                },
            });
            this.logger.log(`Created LUNEO product from WooCommerce product ${wooProduct.id}`);
        }
        /**
         * Met à jour un produit LUNEO à partir de WooCommerce
         */
        async updateLuneoProductFromWooCommerce(luneoProductId, wooProduct) {
            await this.prisma.product.update({
                where: { id: luneoProductId },
                data: {
                    name: wooProduct.name,
                    description: wooProduct.description,
                    price: parseFloat(wooProduct.price || '0'),
                    images: wooProduct.images.map(img => img.src),
                    isActive: wooProduct.status === 'publish',
                },
            });
            this.logger.log(`Updated LUNEO product ${luneoProductId} from WooCommerce`);
        }
        /**
         * Crée une commande LUNEO à partir de WooCommerce
         */
        async createLuneoOrder(integration, wooOrder, lineItem, mapping) {
            // @ts-ignore - userEmail exists in schema but Prisma client may need regeneration
            const existingOrder = await this.prisma.order.findFirst({
                where: {
                    // @ts-ignore - userEmail exists in schema but Prisma client may need regeneration
                    userEmail: wooOrder.billing.email,
                    // Recherche par email car metadata n'est pas dans OrderWhereInput
                },
            });
            if (existingOrder)
                return;
            await this.prisma.order.create({
                data: {
                    brandId: integration.brandId,
                    productId: mapping.luneoProductId,
                    orderNumber: `WC-${wooOrder.id}`,
                    customerEmail: wooOrder.billing.email,
                    customerName: `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`,
                    subtotalCents: Math.round(parseFloat(lineItem.total) * 100),
                    taxCents: Math.round(parseFloat(wooOrder.total_tax) * 100),
                    totalCents: Math.round(parseFloat(wooOrder.total) * 100),
                    currency: wooOrder.currency,
                    status: this.mapWooCommerceOrderStatus(wooOrder.status),
                    shippingAddress: wooOrder.shipping,
                    metadata: {
                        woocommerceOrderId: wooOrder.id,
                        lineItemId: lineItem.id,
                        customMeta: lineItem.meta_data || [],
                    },
                },
            });
            this.logger.log(`Created LUNEO order from WooCommerce order ${wooOrder.id}`);
        }
        /**
         * Mappe le statut de commande WooCommerce
         */
        mapWooCommerceOrderStatus(status) {
            const statusMap = {
                'pending': 'PENDING_PAYMENT',
                'processing': 'PROCESSING',
                'on-hold': 'PENDING_PAYMENT',
                'completed': 'DELIVERED',
                'cancelled': 'CANCELLED',
                'refunded': 'REFUNDED',
                'failed': 'CANCELLED',
            };
            return statusMap[status] || 'CREATED';
        }
        /**
         * Synchronise les produits
         */
        async syncProducts(integrationId, options) {
            const startTime = Date.now();
            const errors = [];
            let itemsProcessed = 0;
            let itemsFailed = 0;
            try {
                this.logger.log(`Starting WooCommerce product sync for ${integrationId}`);
                const products = await this.getProducts(integrationId, { per_page: 100 });
                for (const product of products) {
                    try {
                        await this.handleProductWebhook(integrationId, product);
                        itemsProcessed++;
                    }
                    catch (error) {
                        errors.push({
                            itemId: product.id.toString(),
                            code: 'SYNC_ERROR',
                            message: error.message,
                        });
                        itemsFailed++;
                    }
                }
                const syncLog = await this.prisma.syncLog.create({
                    data: {
                        integrationId,
                        type: 'product',
                        direction: 'import',
                        status: itemsFailed === 0 ? 'success' : 'partial',
                        itemsProcessed,
                        itemsFailed,
                        errors,
                        duration: Date.now() - startTime,
                    },
                });
                return {
                    integrationId,
                    platform: 'woocommerce',
                    type: 'product',
                    direction: 'import',
                    status: syncLog.status,
                    itemsProcessed,
                    itemsFailed,
                    duration: Date.now() - startTime,
                    errors,
                    summary: {
                        created: itemsProcessed - itemsFailed,
                        updated: 0,
                        deleted: 0,
                        skipped: itemsFailed,
                    },
                    createdAt: new Date(),
                };
            }
            catch (error) {
                this.logger.error(`WooCommerce product sync failed:`, error);
                throw error;
            }
        }
        /**
         * Récupère une intégration
         */
        async getIntegration(integrationId) {
            const integration = await this.prisma.ecommerceIntegration.findUnique({
                where: { id: integrationId },
            });
            if (!integration) {
                throw new Error(`Integration ${integrationId} not found`);
            }
            return integration;
        }
        /**
         * Récupère les credentials décryptés
         */
        getCredentials(integration) {
            return {
                consumerKey: this.decryptToken(integration.config.consumerKey),
                consumerSecret: this.decryptToken(integration.config.consumerSecret),
            };
        }
        /**
         * Génère un secret de webhook
         */
        generateWebhookSecret() {
            return crypto.randomBytes(32).toString('hex');
        }
        /**
         * Crypte un token
         */
        encryptToken(token) {
            return Buffer.from(token).toString('base64');
        }
        /**
         * Décrypte un token
         */
        decryptToken(encryptedToken) {
            return Buffer.from(encryptedToken, 'base64').toString('utf8');
        }
    };
    __setFunctionName(_classThis, "WooCommerceConnector");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WooCommerceConnector = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WooCommerceConnector = _classThis;
})();
exports.WooCommerceConnector = WooCommerceConnector;
