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
exports.ProductSyncService = void 0;
const common_1 = require("@nestjs/common");
let ProductSyncService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ProductSyncService = _classThis = class {
        constructor(syncQueue, prisma, cache, shopifyConnector, woocommerceConnector, magentoConnector) {
            this.syncQueue = syncQueue;
            this.prisma = prisma;
            this.cache = cache;
            this.shopifyConnector = shopifyConnector;
            this.woocommerceConnector = woocommerceConnector;
            this.magentoConnector = magentoConnector;
            this.logger = new common_1.Logger(ProductSyncService.name);
        }
        /**
         * Synchronise les produits d'une intégration
         */
        async syncProducts(request) {
            const { integrationId, productIds, options } = request;
            try {
                // Récupérer l'intégration
                const integration = await this.prisma.ecommerceIntegration.findUnique({
                    where: { id: integrationId },
                });
                if (!integration) {
                    throw new Error(`Integration ${integrationId} not found`);
                }
                this.logger.log(`Starting product sync for ${integration.platform} integration ${integrationId}`);
                // Synchroniser selon la plateforme
                let result;
                switch (integration.platform) {
                    case 'shopify':
                        result = await this.shopifyConnector.syncProducts(integrationId, options);
                        break;
                    case 'woocommerce':
                        result = await this.woocommerceConnector.syncProducts(integrationId, options);
                        break;
                    case 'magento':
                        result = await this.magentoConnector.syncProducts(integrationId, options);
                        break;
                    default:
                        throw new Error(`Unsupported platform: ${integration.platform}`);
                }
                // Mettre à jour la dernière sync
                await this.prisma.ecommerceIntegration.update({
                    where: { id: integrationId },
                    data: { lastSyncAt: new Date() },
                });
                this.logger.log(`Product sync completed: ${result.itemsProcessed} products processed`);
                return result;
            }
            catch (error) {
                this.logger.error(`Product sync failed for integration ${integrationId}:`, error);
                throw error;
            }
        }
        /**
         * Synchronise un produit spécifique
         */
        async syncProduct(integrationId, luneoProductId, direction = 'export') {
            try {
                const integration = await this.prisma.ecommerceIntegration.findUnique({
                    where: { id: integrationId },
                });
                if (!integration) {
                    throw new Error(`Integration ${integrationId} not found`);
                }
                if (direction === 'export') {
                    // Exporter le produit LUNEO vers la plateforme e-commerce
                    await this.exportProduct(integration, luneoProductId);
                }
                else {
                    // Importer depuis la plateforme (nécessite l'ID externe)
                    this.logger.warn('Import of single product requires external product ID');
                }
            }
            catch (error) {
                this.logger.error(`Product sync failed:`, error);
                throw error;
            }
        }
        /**
         * Exporte un produit LUNEO vers la plateforme e-commerce
         */
        async exportProduct(integration, luneoProductId) {
            const product = await this.prisma.product.findUnique({
                where: { id: luneoProductId },
            });
            if (!product) {
                throw new Error(`Product ${luneoProductId} not found`);
            }
            // Vérifier si le produit est déjà mappé
            const mapping = await this.prisma.productMapping.findFirst({
                where: {
                    integrationId: integration.id,
                    luneoProductId,
                },
            });
            const productData = this.transformLuneoProductToExternal(product, integration.platform);
            switch (integration.platform) {
                case 'shopify':
                    const shopifyProduct = await this.shopifyConnector.upsertProduct(integration.id, productData, mapping?.externalProductId);
                    if (!mapping) {
                        await this.createProductMapping(integration.id, luneoProductId, shopifyProduct.id, product.sku || '');
                    }
                    break;
                case 'woocommerce':
                    const wooProduct = await this.woocommerceConnector.upsertProduct(integration.id, productData, mapping ? parseInt(mapping.externalProductId) : undefined);
                    if (!mapping) {
                        await this.createProductMapping(integration.id, luneoProductId, wooProduct.id.toString(), product.sku || '');
                    }
                    break;
                case 'magento':
                    const magentoProduct = await this.magentoConnector.upsertProduct(integration.id, productData, mapping?.externalSku);
                    if (!mapping) {
                        await this.createProductMapping(integration.id, luneoProductId, magentoProduct.id.toString(), magentoProduct.sku);
                    }
                    break;
            }
            this.logger.log(`Exported product ${luneoProductId} to ${integration.platform}`);
        }
        /**
         * Transforme un produit LUNEO en format externe
         */
        transformLuneoProductToExternal(product, platform) {
            const images = Array.isArray(product.images)
                ? product.images.filter((img) => typeof img === 'string')
                : [];
            switch (platform) {
                case 'shopify':
                    return {
                        title: product.name,
                        body_html: product.description || '',
                        vendor: 'LUNEO',
                        product_type: 'Customizable',
                        tags: ['luneo', 'customizable'],
                        variants: [{
                                sku: product.sku,
                                price: product.price?.toString() || '0',
                                inventory_quantity: 1000,
                            }],
                        images: images.map((src, index) => ({
                            src,
                            position: index + 1,
                        })),
                    };
                case 'woocommerce':
                    return {
                        name: product.name,
                        description: product.description || '',
                        short_description: '',
                        sku: product.sku,
                        regular_price: product.price?.toString() || '0',
                        status: product.isActive ? 'publish' : 'draft',
                        type: 'simple',
                        images: images.map((src, index) => ({
                            src,
                            position: index,
                        })),
                    };
                case 'magento':
                    return {
                        sku: product.sku,
                        name: product.name,
                        price: product.price,
                        status: product.isActive ? 1 : 2,
                        visibility: 4,
                        type_id: 'simple',
                        attribute_set_id: 4,
                    };
                default:
                    return product;
            }
        }
        /**
         * Crée un mapping de produit
         */
        async createProductMapping(integrationId, luneoProductId, externalProductId, sku) {
            await this.prisma.productMapping.create({
                data: {
                    integrationId,
                    luneoProductId,
                    externalProductId,
                    externalSku: sku,
                    syncStatus: 'synced',
                    lastSyncedAt: new Date(),
                },
            });
        }
        /**
         * Programme une synchronisation automatique
         */
        async scheduleSyncJob(integrationId, interval) {
            const job = await this.syncQueue.add('sync-products', { integrationId }, {
                repeat: {
                    cron: this.getCronExpression(interval),
                },
            });
            this.logger.log(`Scheduled product sync job for integration ${integrationId}: ${interval}`);
        }
        /**
         * Obtient l'expression cron selon l'intervalle
         */
        getCronExpression(interval) {
            switch (interval) {
                case 'hourly': return '0 * * * *';
                case 'daily': return '0 2 * * *'; // 2AM
                case 'weekly': return '0 2 * * 0'; // Sunday 2AM
                default: return '0 2 * * *';
            }
        }
        /**
         * Obtient les statistiques de synchronisation
         */
        async getSyncStats(integrationId, period = 'week') {
            const cacheKey = `sync_stats:${integrationId}:${period}`;
            const cached = await this.cache.getSimple(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            try {
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
                const syncLogs = await this.prisma.syncLog.findMany({
                    where: {
                        integrationId,
                        createdAt: {
                            gte: startDate,
                            lte: now,
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                const stats = {
                    period,
                    totalSyncs: syncLogs.length,
                    successfulSyncs: syncLogs.filter(log => log.status === 'success').length,
                    failedSyncs: syncLogs.filter(log => log.status === 'failed').length,
                    partialSyncs: syncLogs.filter(log => log.status === 'partial').length,
                    totalItemsProcessed: syncLogs.reduce((sum, log) => sum + log.itemsProcessed, 0),
                    totalItemsFailed: syncLogs.reduce((sum, log) => sum + log.itemsFailed, 0),
                    averageDuration: syncLogs.length > 0
                        ? syncLogs.reduce((sum, log) => sum + log.duration, 0) / syncLogs.length
                        : 0,
                    lastSync: syncLogs[0] || null,
                };
                await this.cache.setSimple(cacheKey, JSON.stringify(stats), 300);
                return stats;
            }
            catch (error) {
                this.logger.error(`Error getting sync stats:`, error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "ProductSyncService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductSyncService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductSyncService = _classThis;
})();
exports.ProductSyncService = ProductSyncService;
