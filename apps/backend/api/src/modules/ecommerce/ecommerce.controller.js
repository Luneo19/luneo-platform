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
exports.EcommerceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/guards/jwt-auth.guard");
let EcommerceController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('E-commerce Integrations'), (0, common_1.Controller)('ecommerce')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _shopifyInstall_decorators;
    let _shopifyCallback_decorators;
    let _shopifyWebhook_decorators;
    let _getShopifyProducts_decorators;
    let _syncShopifyProducts_decorators;
    let _woocommerceConnect_decorators;
    let _woocommerceWebhook_decorators;
    let _getWooCommerceProducts_decorators;
    let _syncWooCommerceProducts_decorators;
    let _magentoConnect_decorators;
    let _getMagentoProducts_decorators;
    let _syncMagentoProducts_decorators;
    let _syncProducts_decorators;
    let _syncOrders_decorators;
    let _getSyncStats_decorators;
    let _getOrderStats_decorators;
    let _getWebhookHistory_decorators;
    let _getWebhookStats_decorators;
    let _retryWebhook_decorators;
    let _getProductMappings_decorators;
    let _createProductMapping_decorators;
    let _listIntegrations_decorators;
    let _getIntegration_decorators;
    let _updateIntegration_decorators;
    let _deleteIntegration_decorators;
    var EcommerceController = _classThis = class {
        constructor(prisma, shopifyConnector, woocommerceConnector, magentoConnector, productSyncService, orderSyncService, webhookHandlerService) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.shopifyConnector = shopifyConnector;
            this.woocommerceConnector = woocommerceConnector;
            this.magentoConnector = magentoConnector;
            this.productSyncService = productSyncService;
            this.orderSyncService = orderSyncService;
            this.webhookHandlerService = webhookHandlerService;
        }
        // ========================================
        // SHOPIFY
        // ========================================
        async shopifyInstall(body) {
            const installUrl = this.shopifyConnector.generateInstallUrl(body.shop, body.brandId);
            return { installUrl };
        }
        async shopifyCallback(shop, code, state, res) {
            try {
                // Échanger le code contre un token
                const accessToken = await this.shopifyConnector.exchangeCodeForToken(shop, code);
                // Récupérer le brandId depuis le state/session (simplification ici)
                const brandId = 'temp-brand-id'; // À récupérer depuis la session
                // Sauvegarder l'intégration
                await this.shopifyConnector.saveIntegration(brandId, shop, accessToken);
                // Rediriger vers le dashboard
                res.redirect(`${process.env.FRONTEND_URL}/integrations?shopify=success`);
            }
            catch (error) {
                res.redirect(`${process.env.FRONTEND_URL}/integrations?shopify=error`);
            }
        }
        async shopifyWebhook(topic, shop, hmac, payload) {
            await this.webhookHandlerService.handleShopifyWebhook(topic, shop, payload, hmac);
            return { status: 'processed' };
        }
        async getShopifyProducts(integrationId, limit) {
            return this.shopifyConnector.getProducts(integrationId, { limit });
        }
        async syncShopifyProducts(integrationId) {
            return this.productSyncService.syncProducts({ integrationId });
        }
        // ========================================
        // WOOCOMMERCE
        // ========================================
        async woocommerceConnect(body) {
            return this.woocommerceConnector.connect(body.brandId, body.siteUrl, body.consumerKey, body.consumerSecret);
        }
        async woocommerceWebhook(topic, signature, payload) {
            await this.webhookHandlerService.handleWooCommerceWebhook(topic, payload, signature);
            return { status: 'processed' };
        }
        async getWooCommerceProducts(integrationId, perPage) {
            return this.woocommerceConnector.getProducts(integrationId, { per_page: perPage });
        }
        async syncWooCommerceProducts(integrationId) {
            return this.productSyncService.syncProducts({ integrationId });
        }
        // ========================================
        // MAGENTO
        // ========================================
        async magentoConnect(body) {
            return this.magentoConnector.connect(body.brandId, body.storeUrl, body.apiToken);
        }
        async getMagentoProducts(integrationId, pageSize) {
            return this.magentoConnector.getProducts(integrationId, { pageSize });
        }
        async syncMagentoProducts(integrationId) {
            return this.productSyncService.syncProducts({ integrationId });
        }
        // ========================================
        // SYNC MANAGEMENT
        // ========================================
        async syncProducts(integrationId, body) {
            return this.productSyncService.syncProducts({
                integrationId,
                productIds: body?.productIds,
                options: body?.options,
            });
        }
        async syncOrders(integrationId, body) {
            return this.orderSyncService.syncOrders({
                integrationId,
                orderIds: body?.orderIds,
                options: body?.options,
            });
        }
        async getSyncStats(integrationId, period = 'week') {
            return this.productSyncService.getSyncStats(integrationId, period);
        }
        async getOrderStats(integrationId, period = 'week') {
            return this.orderSyncService.getOrderStats(integrationId, period);
        }
        async getWebhookHistory(integrationId, limit = 50) {
            return this.webhookHandlerService.getWebhookHistory(integrationId, limit);
        }
        async getWebhookStats(integrationId, period = 'week') {
            return this.webhookHandlerService.getWebhookStats(integrationId, period);
        }
        async retryWebhook(webhookId) {
            await this.webhookHandlerService.retryWebhook(webhookId);
            return { status: 'retried' };
        }
        // ========================================
        // PRODUCT MAPPING
        // ========================================
        async getProductMappings(integrationId) {
            const mappings = await this.prisma.productMapping.findMany({
                where: { integrationId },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            price: true,
                        },
                    },
                },
            });
            return mappings;
        }
        async createProductMapping(integrationId, body) {
            return this.prisma.productMapping.create({
                data: {
                    integrationId,
                    luneoProductId: body.luneoProductId,
                    externalProductId: body.externalProductId,
                    externalSku: body.externalSku,
                    syncStatus: 'synced',
                    lastSyncedAt: new Date(),
                },
            });
        }
        // ========================================
        // INTEGRATION MANAGEMENT
        // ========================================
        async listIntegrations(brandId) {
            const where = brandId ? { brandId } : {};
            return this.prisma.ecommerceIntegration.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
        }
        async getIntegration(integrationId) {
            return this.prisma.ecommerceIntegration.findUnique({
                where: { id: integrationId },
            });
        }
        async updateIntegration(integrationId, body) {
            return this.prisma.ecommerceIntegration.update({
                where: { id: integrationId },
                data: body,
            });
        }
        async deleteIntegration(integrationId) {
            await this.prisma.ecommerceIntegration.delete({
                where: { id: integrationId },
            });
        }
    };
    __setFunctionName(_classThis, "EcommerceController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _shopifyInstall_decorators = [(0, common_1.Post)('shopify/install'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Génère l\'URL d\'installation Shopify' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'URL générée avec succès' })];
        _shopifyCallback_decorators = [(0, common_1.Get)('shopify/callback'), (0, swagger_1.ApiOperation)({ summary: 'Callback OAuth Shopify' }), (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirect après installation' })];
        _shopifyWebhook_decorators = [(0, common_1.Post)('shopify/webhook'), (0, swagger_1.ApiOperation)({ summary: 'Reçoit les webhooks Shopify' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook traité' }), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        _getShopifyProducts_decorators = [(0, common_1.Get)('shopify/:integrationId/products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Récupère les produits Shopify' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Produits récupérés' })];
        _syncShopifyProducts_decorators = [(0, common_1.Post)('shopify/:integrationId/sync/products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Synchronise les produits Shopify' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Synchronisation lancée' })];
        _woocommerceConnect_decorators = [(0, common_1.Post)('woocommerce/connect'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Connecte une boutique WooCommerce' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Connexion réussie' })];
        _woocommerceWebhook_decorators = [(0, common_1.Post)('woocommerce/webhook'), (0, swagger_1.ApiOperation)({ summary: 'Reçoit les webhooks WooCommerce' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook traité' }), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        _getWooCommerceProducts_decorators = [(0, common_1.Get)('woocommerce/:integrationId/products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Récupère les produits WooCommerce' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Produits récupérés' })];
        _syncWooCommerceProducts_decorators = [(0, common_1.Post)('woocommerce/:integrationId/sync/products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Synchronise les produits WooCommerce' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Synchronisation lancée' })];
        _magentoConnect_decorators = [(0, common_1.Post)('magento/connect'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Connecte une boutique Magento' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Connexion réussie' })];
        _getMagentoProducts_decorators = [(0, common_1.Get)('magento/:integrationId/products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Récupère les produits Magento' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Produits récupérés' })];
        _syncMagentoProducts_decorators = [(0, common_1.Post)('magento/:integrationId/sync/products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Synchronise les produits Magento' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Synchronisation lancée' })];
        _syncProducts_decorators = [(0, common_1.Post)('integrations/:integrationId/sync/products'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Synchronise les produits (toutes plateformes)' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Synchronisation lancée' })];
        _syncOrders_decorators = [(0, common_1.Post)('integrations/:integrationId/sync/orders'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Synchronise les commandes' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Synchronisation lancée' })];
        _getSyncStats_decorators = [(0, common_1.Get)('integrations/:integrationId/sync/stats'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtient les statistiques de synchronisation' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques récupérées' })];
        _getOrderStats_decorators = [(0, common_1.Get)('integrations/:integrationId/orders/stats'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtient les statistiques des commandes' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques récupérées' })];
        _getWebhookHistory_decorators = [(0, common_1.Get)('integrations/:integrationId/webhooks/history'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtient l\'historique des webhooks' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Historique récupéré' })];
        _getWebhookStats_decorators = [(0, common_1.Get)('integrations/:integrationId/webhooks/stats'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtient les statistiques des webhooks' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistiques récupérées' })];
        _retryWebhook_decorators = [(0, common_1.Post)('webhooks/:webhookId/retry'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Réessaye un webhook échoué' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook réessayé' })];
        _getProductMappings_decorators = [(0, common_1.Get)('integrations/:integrationId/mappings'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtient les mappings de produits' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Mappings récupérés' })];
        _createProductMapping_decorators = [(0, common_1.Post)('integrations/:integrationId/mappings'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Crée un mapping de produit' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Mapping créé' })];
        _listIntegrations_decorators = [(0, common_1.Get)('integrations'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Liste toutes les intégrations' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Intégrations récupérées' })];
        _getIntegration_decorators = [(0, common_1.Get)('integrations/:integrationId'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Obtient une intégration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Intégration récupérée' })];
        _updateIntegration_decorators = [(0, common_1.Put)('integrations/:integrationId'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Met à jour une intégration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Intégration mise à jour' })];
        _deleteIntegration_decorators = [(0, common_1.Delete)('integrations/:integrationId'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Supprime une intégration' }), (0, swagger_1.ApiResponse)({ status: 204, description: 'Intégration supprimée' }), (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT)];
        __esDecorate(_classThis, null, _shopifyInstall_decorators, { kind: "method", name: "shopifyInstall", static: false, private: false, access: { has: obj => "shopifyInstall" in obj, get: obj => obj.shopifyInstall }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _shopifyCallback_decorators, { kind: "method", name: "shopifyCallback", static: false, private: false, access: { has: obj => "shopifyCallback" in obj, get: obj => obj.shopifyCallback }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _shopifyWebhook_decorators, { kind: "method", name: "shopifyWebhook", static: false, private: false, access: { has: obj => "shopifyWebhook" in obj, get: obj => obj.shopifyWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getShopifyProducts_decorators, { kind: "method", name: "getShopifyProducts", static: false, private: false, access: { has: obj => "getShopifyProducts" in obj, get: obj => obj.getShopifyProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncShopifyProducts_decorators, { kind: "method", name: "syncShopifyProducts", static: false, private: false, access: { has: obj => "syncShopifyProducts" in obj, get: obj => obj.syncShopifyProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _woocommerceConnect_decorators, { kind: "method", name: "woocommerceConnect", static: false, private: false, access: { has: obj => "woocommerceConnect" in obj, get: obj => obj.woocommerceConnect }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _woocommerceWebhook_decorators, { kind: "method", name: "woocommerceWebhook", static: false, private: false, access: { has: obj => "woocommerceWebhook" in obj, get: obj => obj.woocommerceWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWooCommerceProducts_decorators, { kind: "method", name: "getWooCommerceProducts", static: false, private: false, access: { has: obj => "getWooCommerceProducts" in obj, get: obj => obj.getWooCommerceProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncWooCommerceProducts_decorators, { kind: "method", name: "syncWooCommerceProducts", static: false, private: false, access: { has: obj => "syncWooCommerceProducts" in obj, get: obj => obj.syncWooCommerceProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _magentoConnect_decorators, { kind: "method", name: "magentoConnect", static: false, private: false, access: { has: obj => "magentoConnect" in obj, get: obj => obj.magentoConnect }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMagentoProducts_decorators, { kind: "method", name: "getMagentoProducts", static: false, private: false, access: { has: obj => "getMagentoProducts" in obj, get: obj => obj.getMagentoProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncMagentoProducts_decorators, { kind: "method", name: "syncMagentoProducts", static: false, private: false, access: { has: obj => "syncMagentoProducts" in obj, get: obj => obj.syncMagentoProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncProducts_decorators, { kind: "method", name: "syncProducts", static: false, private: false, access: { has: obj => "syncProducts" in obj, get: obj => obj.syncProducts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncOrders_decorators, { kind: "method", name: "syncOrders", static: false, private: false, access: { has: obj => "syncOrders" in obj, get: obj => obj.syncOrders }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSyncStats_decorators, { kind: "method", name: "getSyncStats", static: false, private: false, access: { has: obj => "getSyncStats" in obj, get: obj => obj.getSyncStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOrderStats_decorators, { kind: "method", name: "getOrderStats", static: false, private: false, access: { has: obj => "getOrderStats" in obj, get: obj => obj.getOrderStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWebhookHistory_decorators, { kind: "method", name: "getWebhookHistory", static: false, private: false, access: { has: obj => "getWebhookHistory" in obj, get: obj => obj.getWebhookHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getWebhookStats_decorators, { kind: "method", name: "getWebhookStats", static: false, private: false, access: { has: obj => "getWebhookStats" in obj, get: obj => obj.getWebhookStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _retryWebhook_decorators, { kind: "method", name: "retryWebhook", static: false, private: false, access: { has: obj => "retryWebhook" in obj, get: obj => obj.retryWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProductMappings_decorators, { kind: "method", name: "getProductMappings", static: false, private: false, access: { has: obj => "getProductMappings" in obj, get: obj => obj.getProductMappings }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createProductMapping_decorators, { kind: "method", name: "createProductMapping", static: false, private: false, access: { has: obj => "createProductMapping" in obj, get: obj => obj.createProductMapping }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listIntegrations_decorators, { kind: "method", name: "listIntegrations", static: false, private: false, access: { has: obj => "listIntegrations" in obj, get: obj => obj.listIntegrations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getIntegration_decorators, { kind: "method", name: "getIntegration", static: false, private: false, access: { has: obj => "getIntegration" in obj, get: obj => obj.getIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateIntegration_decorators, { kind: "method", name: "updateIntegration", static: false, private: false, access: { has: obj => "updateIntegration" in obj, get: obj => obj.updateIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteIntegration_decorators, { kind: "method", name: "deleteIntegration", static: false, private: false, access: { has: obj => "deleteIntegration" in obj, get: obj => obj.deleteIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EcommerceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EcommerceController = _classThis;
})();
exports.EcommerceController = EcommerceController;
