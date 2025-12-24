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
exports.ShopifyConnector = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
let ShopifyConnector = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ShopifyConnector = _classThis = class {
        constructor(httpService, configService, prisma, cache) {
            this.httpService = httpService;
            this.configService = configService;
            this.prisma = prisma;
            this.cache = cache;
            this.logger = new common_1.Logger(ShopifyConnector.name);
            this.API_VERSION = '2024-10';
        }
        /**
         * Génère l'URL d'installation Shopify OAuth
         */
        generateInstallUrl(shop, brandId) {
            const apiKey = this.configService.get('shopify.apiKey');
            const scopes = [
                'read_products',
                'write_products',
                'read_orders',
                'write_orders',
                'read_inventory',
                'write_inventory',
                'read_customers',
            ].join(',');
            const redirectUri = `${this.configService.get('app.url')}/api/ecommerce/shopify/callback`;
            const nonce = crypto.randomBytes(16).toString('hex');
            // Sauvegarder le nonce pour validation
            this.cache.setSimple(`shopify_nonce:${shop}`, nonce, 600); // 10 minutes
            const installUrl = `https://${shop}/admin/oauth/authorize?` +
                `client_id=${apiKey}&` +
                `scope=${scopes}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `state=${nonce}&` +
                `grant_options[]=per-user`;
            return installUrl;
        }
        /**
         * Échange le code OAuth contre un access token
         */
        async exchangeCodeForToken(shop, code) {
            const apiKey = this.configService.get('shopify.apiKey');
            const apiSecret = this.configService.get('shopify.apiSecret');
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`https://${shop}/admin/oauth/access_token`, {
                    client_id: apiKey,
                    client_secret: apiSecret,
                    code,
                }));
                return response.data.access_token;
            }
            catch (error) {
                this.logger.error(`Error exchanging code for token:`, error);
                throw new Error('Failed to obtain access token from Shopify');
            }
        }
        /**
         * Sauvegarde l'intégration Shopify
         */
        async saveIntegration(brandId, shop, accessToken) {
            const integration = await this.prisma.ecommerceIntegration.create({
                data: {
                    brandId,
                    platform: 'shopify',
                    shopDomain: shop,
                    accessToken: this.encryptToken(accessToken),
                    config: {
                        apiVersion: this.API_VERSION,
                        scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
                    },
                    status: 'active',
                },
            });
            // Configurer les webhooks
            await this.setupWebhooks(integration.id, shop, accessToken);
            this.logger.log(`Shopify integration saved for brand ${brandId}`);
            return integration;
        }
        /**
         * Configure les webhooks Shopify
         */
        async setupWebhooks(integrationId, shop, accessToken) {
            const webhookUrl = `${this.configService.get('app.url')}/api/ecommerce/shopify/webhook`;
            const topics = [
                'products/create',
                'products/update',
                'products/delete',
                'orders/create',
                'orders/updated',
                'orders/paid',
                'inventory_levels/update',
            ];
            for (const topic of topics) {
                try {
                    await this.createWebhook(shop, accessToken, topic, webhookUrl);
                    this.logger.log(`Webhook created for topic: ${topic}`);
                }
                catch (error) {
                    this.logger.error(`Error creating webhook for ${topic}:`, error);
                }
            }
        }
        /**
         * Crée un webhook Shopify
         */
        async createWebhook(shop, accessToken, topic, address) {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`https://${shop}/admin/api/${this.API_VERSION}/webhooks.json`, {
                webhook: {
                    topic,
                    address,
                    format: 'json',
                },
            }, {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json',
                },
            }));
            return response.data.webhook;
        }
        /**
         * Récupère les produits Shopify
         */
        async getProducts(integrationId, options) {
            const integration = await this.getIntegration(integrationId);
            const accessToken = this.decryptToken(integration.accessToken);
            try {
                const params = new URLSearchParams();
                if (options?.limit)
                    params.append('limit', options.limit.toString());
                if (options?.since_id)
                    params.append('since_id', options.since_id);
                if (options?.status)
                    params.append('status', options.status);
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://${integration.shopDomain}/admin/api/${this.API_VERSION}/products.json?${params}`, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                    },
                }));
                return response.data.products;
            }
            catch (error) {
                this.logger.error(`Error fetching Shopify products:`, error);
                throw error;
            }
        }
        /**
         * Crée ou met à jour un produit Shopify
         */
        async upsertProduct(integrationId, productData, externalProductId) {
            const integration = await this.getIntegration(integrationId);
            const accessToken = this.decryptToken(integration.accessToken);
            try {
                const url = externalProductId
                    ? `https://${integration.shopDomain}/admin/api/${this.API_VERSION}/products/${externalProductId}.json`
                    : `https://${integration.shopDomain}/admin/api/${this.API_VERSION}/products.json`;
                const method = externalProductId ? 'put' : 'post';
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService[method](url, { product: productData }, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json',
                    },
                }));
                return response.data.product;
            }
            catch (error) {
                this.logger.error(`Error upserting Shopify product:`, error);
                throw error;
            }
        }
        /**
         * Récupère les commandes Shopify
         */
        async getOrders(integrationId, options) {
            const integration = await this.getIntegration(integrationId);
            const accessToken = this.decryptToken(integration.accessToken);
            try {
                const params = new URLSearchParams();
                if (options?.limit)
                    params.append('limit', options.limit.toString());
                if (options?.status)
                    params.append('status', options.status);
                if (options?.created_at_min)
                    params.append('created_at_min', options.created_at_min);
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://${integration.shopDomain}/admin/api/${this.API_VERSION}/orders.json?${params}`, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                    },
                }));
                const apiResponse = response.data;
                return apiResponse?.data?.orders || [];
            }
            catch (error) {
                this.logger.error(`Error fetching Shopify orders:`, error);
                throw error;
            }
        }
        /**
         * Met à jour le statut d'une commande Shopify
         */
        async updateOrderStatus(integrationId, orderId, status) {
            const integration = await this.getIntegration(integrationId);
            const accessToken = this.decryptToken(integration.accessToken);
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.put(`https://${integration.shopDomain}/admin/api/${this.API_VERSION}/orders/${orderId}.json`, {
                    order: {
                        id: orderId,
                        tags: `luneo_status:${status}`,
                    },
                }, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json',
                    },
                }));
                const apiResponse = response.data;
                return apiResponse?.data?.order || null;
            }
            catch (error) {
                this.logger.error(`Error updating Shopify order status:`, error);
                throw error;
            }
        }
        /**
         * Valide un webhook Shopify
         */
        validateWebhook(payload, hmacHeader, secret) {
            const hash = crypto
                .createHmac('sha256', secret)
                .update(payload, 'utf8')
                .digest('base64');
            return hash === hmacHeader;
        }
        /**
         * Traite un webhook Shopify
         */
        async handleWebhook(topic, shop, payload) {
            this.logger.log(`Handling Shopify webhook: ${topic} for shop: ${shop}`);
            try {
                // Trouver l'intégration
                const integration = await this.prisma.ecommerceIntegration.findFirst({
                    where: {
                        platform: 'shopify',
                        shopDomain: shop,
                        status: 'active',
                    },
                });
                if (!integration) {
                    this.logger.warn(`No active integration found for shop: ${shop}`);
                    return;
                }
                // Traiter selon le topic
                switch (topic) {
                    case 'products/create':
                    case 'products/update':
                        await this.handleProductWebhook(integration.id, payload);
                        break;
                    case 'products/delete':
                        await this.handleProductDeleteWebhook(integration.id, payload);
                        break;
                    case 'orders/create':
                    case 'orders/updated':
                    case 'orders/paid':
                        await this.handleOrderWebhook(integration.id, payload);
                        break;
                    case 'inventory_levels/update':
                        await this.handleInventoryWebhook(integration.id, payload);
                        break;
                    default:
                        this.logger.warn(`Unhandled webhook topic: ${topic}`);
                }
            }
            catch (error) {
                this.logger.error(`Error handling webhook for ${topic}:`, error);
                throw error;
            }
        }
        /**
         * Traite un webhook de produit
         */
        async handleProductWebhook(integrationId, product) {
            // Vérifier si le produit existe déjà dans le mapping
            const mapping = await this.prisma.productMapping.findFirst({
                where: {
                    integrationId,
                    externalProductId: product.id.toString(),
                },
            });
            if (mapping) {
                // Mettre à jour le produit existant
                await this.updateLuneoProductFromShopify(mapping.luneoProductId, product);
            }
            else {
                // Créer un nouveau produit
                await this.createLuneoProductFromShopify(integrationId, product);
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
                // Désactiver le produit au lieu de le supprimer
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
            // Créer une commande LUNEO à partir de la commande Shopify
            for (const lineItem of order.line_items) {
                const mapping = await this.prisma.productMapping.findFirst({
                    where: {
                        integrationId,
                        externalProductId: lineItem.product_id.toString(),
                    },
                });
                if (mapping) {
                    // Créer la commande LUNEO
                    await this.createLuneoOrder(integrationId, order, lineItem, mapping);
                }
            }
        }
        /**
         * Traite un webhook d'inventaire
         */
        async handleInventoryWebhook(integrationId, payload) {
            // Mettre à jour l'inventaire dans LUNEO
            this.logger.log(`Inventory update received: ${JSON.stringify(payload)}`);
        }
        /**
         * Crée un produit LUNEO à partir d'un produit Shopify
         */
        async createLuneoProductFromShopify(integrationId, shopifyProduct) {
            const integration = await this.getIntegration(integrationId);
            // Créer le produit LUNEO
            const luneoProduct = await this.prisma.product.create({
                data: {
                    brandId: integration.brandId,
                    name: shopifyProduct.title,
                    description: shopifyProduct.body_html,
                    sku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
                    price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
                    images: shopifyProduct.images.map(img => img.src),
                    isActive: shopifyProduct.status === 'active',
                },
            });
            // Créer le mapping
            await this.prisma.productMapping.create({
                data: {
                    integrationId,
                    luneoProductId: luneoProduct.id,
                    externalProductId: shopifyProduct.id.toString(),
                    externalSku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
                    syncStatus: 'synced',
                    lastSyncedAt: new Date(),
                },
            });
            this.logger.log(`Created LUNEO product ${luneoProduct.id} from Shopify product ${shopifyProduct.id}`);
        }
        /**
         * Met à jour un produit LUNEO à partir d'un produit Shopify
         */
        async updateLuneoProductFromShopify(luneoProductId, shopifyProduct) {
            await this.prisma.product.update({
                where: { id: luneoProductId },
                data: {
                    name: shopifyProduct.title,
                    description: shopifyProduct.body_html,
                    price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
                    images: shopifyProduct.images.map(img => img.src),
                    isActive: shopifyProduct.status === 'active',
                },
            });
            this.logger.log(`Updated LUNEO product ${luneoProductId} from Shopify product ${shopifyProduct.id}`);
        }
        /**
         * Crée une commande LUNEO à partir d'une commande Shopify
         */
        async createLuneoOrder(integrationId, shopifyOrder, lineItem, mapping) {
            const integration = await this.getIntegration(integrationId);
            // Vérifier si la commande existe déjà
            // @ts-ignore - userEmail exists in schema but Prisma client may need regeneration
            const existingOrder = await this.prisma.order.findFirst({
                where: {
                    // @ts-ignore - userEmail exists in schema but Prisma client may need regeneration
                    userEmail: shopifyOrder.email,
                    // Recherche par email car metadata n'est pas dans OrderWhereInput
                },
            });
            if (existingOrder) {
                this.logger.log(`Order already exists for Shopify order ${shopifyOrder.id}`);
                return;
            }
            // Créer la commande LUNEO
            await this.prisma.order.create({
                data: {
                    brandId: integration.brandId,
                    productId: mapping.luneoProductId,
                    orderNumber: `SH-${shopifyOrder.order_number}`,
                    customerEmail: shopifyOrder.email,
                    customerName: `${shopifyOrder.customer?.first_name} ${shopifyOrder.customer?.last_name}`,
                    subtotalCents: Math.round(parseFloat(lineItem.price) * lineItem.quantity * 100),
                    taxCents: Math.round(parseFloat(shopifyOrder.total_tax) * 100),
                    totalCents: Math.round(parseFloat(shopifyOrder.total_price) * 100),
                    currency: shopifyOrder.currency,
                    status: this.mapShopifyOrderStatus(shopifyOrder.financial_status),
                    paymentStatus: this.mapShopifyPaymentStatus(shopifyOrder.financial_status),
                    shippingAddress: shopifyOrder.shipping_address,
                    metadata: {
                        shopifyOrderId: shopifyOrder.id,
                        shopifyOrderNumber: shopifyOrder.order_number,
                        lineItemId: lineItem.id,
                        customProperties: lineItem.properties || [],
                    },
                },
            });
            this.logger.log(`Created LUNEO order from Shopify order ${shopifyOrder.id}`);
        }
        /**
         * Mappe le statut de commande Shopify vers LUNEO
         */
        mapShopifyOrderStatus(financialStatus) {
            const statusMap = {
                'pending': 'PENDING_PAYMENT',
                'authorized': 'PENDING_PAYMENT',
                'paid': 'PAID',
                'partially_paid': 'PENDING_PAYMENT',
                'refunded': 'REFUNDED',
                'voided': 'CANCELLED',
                'partially_refunded': 'PAID',
            };
            return statusMap[financialStatus] || 'CREATED';
        }
        /**
         * Mappe le statut de paiement Shopify vers LUNEO
         */
        mapShopifyPaymentStatus(financialStatus) {
            const paymentMap = {
                'pending': 'PENDING',
                'authorized': 'PENDING',
                'paid': 'SUCCEEDED',
                'partially_paid': 'PENDING',
                'refunded': 'REFUNDED',
                'voided': 'CANCELLED',
                'partially_refunded': 'SUCCEEDED',
            };
            return paymentMap[financialStatus] || 'PENDING';
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
         * Crypte un token
         */
        encryptToken(token) {
            // En production, utiliser un vrai système de cryptage (AES-256)
            return Buffer.from(token).toString('base64');
        }
        /**
         * Décrypte un token
         */
        decryptToken(encryptedToken) {
            // En production, utiliser un vrai système de décryptage
            return Buffer.from(encryptedToken, 'base64').toString('utf8');
        }
        /**
         * Synchronise tous les produits
         */
        async syncProducts(integrationId, options) {
            const startTime = Date.now();
            const errors = [];
            let itemsProcessed = 0;
            let itemsFailed = 0;
            try {
                this.logger.log(`Starting product sync for integration ${integrationId}`);
                // Récupérer tous les produits Shopify
                const shopifyProducts = await this.getProducts(integrationId, { limit: 250 });
                // Traiter chaque produit
                for (const product of shopifyProducts) {
                    try {
                        await this.handleProductWebhook(integrationId, product);
                        itemsProcessed++;
                    }
                    catch (error) {
                        this.logger.error(`Error syncing product ${product.id}:`, error);
                        errors.push({
                            itemId: product.id,
                            code: 'SYNC_ERROR',
                            message: error.message,
                        });
                        itemsFailed++;
                    }
                }
                // Sauvegarder le log de sync
                const syncLog = await this.prisma.syncLog.create({
                    data: {
                        integrationId,
                        type: 'product',
                        direction: 'import',
                        status: itemsFailed === 0 ? 'success' : itemsFailed < itemsProcessed ? 'partial' : 'failed',
                        itemsProcessed,
                        itemsFailed,
                        errors,
                        duration: Date.now() - startTime,
                    },
                });
                const result = {
                    integrationId,
                    platform: 'shopify',
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
                this.logger.log(`Product sync completed: ${itemsProcessed} processed, ${itemsFailed} failed`);
                return result;
            }
            catch (error) {
                this.logger.error(`Product sync failed:`, error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "ShopifyConnector");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ShopifyConnector = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ShopifyConnector = _classThis;
})();
exports.ShopifyConnector = ShopifyConnector;
