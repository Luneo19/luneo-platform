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
exports.OrderSyncService = void 0;
const common_1 = require("@nestjs/common");
let OrderSyncService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OrderSyncService = _classThis = class {
        constructor(syncQueue, prisma, cache, shopifyConnector, woocommerceConnector, magentoConnector) {
            this.syncQueue = syncQueue;
            this.prisma = prisma;
            this.cache = cache;
            this.shopifyConnector = shopifyConnector;
            this.woocommerceConnector = woocommerceConnector;
            this.magentoConnector = magentoConnector;
            this.logger = new common_1.Logger(OrderSyncService.name);
        }
        /**
         * Synchronise les commandes d'une intégration
         */
        async syncOrders(request) {
            const { integrationId, orderIds, options } = request;
            const startTime = Date.now();
            const errors = [];
            let itemsProcessed = 0;
            let itemsFailed = 0;
            try {
                const integration = await this.prisma.ecommerceIntegration.findUnique({
                    where: { id: integrationId },
                });
                if (!integration) {
                    throw new Error(`Integration ${integrationId} not found`);
                }
                this.logger.log(`Starting order sync for ${integration.platform} integration ${integrationId}`);
                // Récupérer les commandes selon la plateforme
                let orders = [];
                switch (integration.platform) {
                    case 'shopify':
                        orders = (await this.shopifyConnector.getOrders(integrationId));
                        break;
                    case 'woocommerce':
                        orders = (await this.woocommerceConnector.getOrders(integrationId));
                        break;
                    case 'magento':
                        orders = (await this.magentoConnector.getOrders(integrationId));
                        break;
                }
                // Traiter chaque commande
                for (const order of orders) {
                    try {
                        await this.processOrder(integration, order);
                        itemsProcessed++;
                    }
                    catch (error) {
                        this.logger.error(`Error processing order:`, error);
                        errors.push({
                            message: error.message || 'Unknown error',
                            orderId: order.id?.toString(),
                            error,
                        });
                        itemsFailed++;
                    }
                }
                // Sauvegarder le log
                const syncLog = await this.prisma.syncLog.create({
                    data: {
                        integrationId,
                        type: 'order',
                        direction: 'import',
                        status: itemsFailed === 0 ? 'success' : itemsFailed < itemsProcessed ? 'partial' : 'failed',
                        itemsProcessed,
                        itemsFailed,
                        errors: errors,
                        duration: Date.now() - startTime,
                    },
                });
                return {
                    integrationId,
                    platform: integration.platform,
                    type: 'order',
                    direction: 'import',
                    status: syncLog.status,
                    itemsProcessed,
                    itemsFailed,
                    duration: Date.now() - startTime,
                    errors: errors,
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
                this.logger.error(`Order sync failed:`, error);
                throw error;
            }
        }
        /**
         * Traite une commande
         */
        async processOrder(integration, order) {
            // Logique spécifique déjà implémentée dans les connecteurs
            this.logger.log(`Processing order ${order.id} from ${integration.platform}`);
        }
        /**
         * Met à jour le statut d'une commande sur la plateforme externe
         */
        async updateExternalOrderStatus(luneoOrderId, status) {
            try {
                const order = await this.prisma.order.findUnique({
                    where: { id: luneoOrderId },
                    select: {
                        metadata: true,
                        brandId: true,
                    },
                });
                if (!order || !order.metadata) {
                    throw new Error(`Order ${luneoOrderId} not found or has no metadata`);
                }
                // Trouver l'intégration
                const integration = await this.prisma.ecommerceIntegration.findFirst({
                    where: {
                        brandId: order.brandId,
                        status: 'active',
                    },
                });
                if (!integration) {
                    this.logger.warn(`No active integration found for order ${luneoOrderId}`);
                    return;
                }
                const metadata = order.metadata || {};
                const externalStatus = this.mapLuneoStatusToExternal(status, integration.platform);
                // Mettre à jour selon la plateforme
                switch (integration.platform) {
                    case 'shopify':
                        const shopifyOrderId = metadata.shopifyOrderId;
                        if (shopifyOrderId && typeof shopifyOrderId === 'string') {
                            await this.shopifyConnector.updateOrderStatus(integration.id, shopifyOrderId, externalStatus);
                        }
                        break;
                    case 'woocommerce':
                        const woocommerceOrderId = metadata.woocommerceOrderId;
                        if (woocommerceOrderId) {
                            const orderId = typeof woocommerceOrderId === 'string'
                                ? parseInt(woocommerceOrderId, 10)
                                : typeof woocommerceOrderId === 'number'
                                    ? woocommerceOrderId
                                    : null;
                            if (orderId !== null && !isNaN(orderId)) {
                                await this.woocommerceConnector.updateOrderStatus(integration.id, orderId, externalStatus);
                            }
                        }
                        break;
                    case 'magento':
                        // Magento update order status (à implémenter si nécessaire)
                        this.logger.log(`Magento order status update not yet implemented`);
                        break;
                }
                this.logger.log(`Updated external order status to ${externalStatus}`);
            }
            catch (error) {
                this.logger.error(`Error updating external order status:`, error);
                throw error;
            }
        }
        /**
         * Mappe le statut LUNEO vers le statut externe
         */
        mapLuneoStatusToExternal(luneoStatus, platform) {
            const shopifyMap = {
                'PROCESSING': 'processing',
                'SHIPPED': 'shipped',
                'DELIVERED': 'delivered',
                'CANCELLED': 'cancelled',
                'REFUNDED': 'refunded',
            };
            const woocommerceMap = {
                'PROCESSING': 'processing',
                'SHIPPED': 'completed',
                'DELIVERED': 'completed',
                'CANCELLED': 'cancelled',
                'REFUNDED': 'refunded',
            };
            switch (platform) {
                case 'shopify':
                    return shopifyMap[luneoStatus] || 'processing';
                case 'woocommerce':
                    return woocommerceMap[luneoStatus] || 'processing';
                case 'magento':
                    return luneoStatus.toLowerCase();
                default:
                    return luneoStatus;
            }
        }
        /**
         * Obtient les commandes récentes d'une intégration
         */
        async getRecentOrders(integrationId, limit = 50) {
            try {
                // Query orders with metadata containing integrationId
                // Note: Prisma doesn't support JSON path queries directly, so we filter in memory
                // For production, consider adding a dedicated integrationId field or using raw SQL
                const allOrders = await this.prisma.order.findMany({
                    take: limit * 2, // Get more to filter
                    orderBy: { createdAt: 'desc' },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                            },
                        },
                        design: {
                            select: {
                                id: true,
                                prompt: true,
                                previewUrl: true,
                            },
                        },
                    },
                });
                // Filter orders where metadata.integrationId matches
                const filteredOrders = allOrders.filter(order => {
                    if (!order.metadata || typeof order.metadata !== 'object') {
                        return false;
                    }
                    const metadata = order.metadata;
                    return metadata.integrationId === integrationId;
                }).slice(0, limit);
                // Transform to expected return type
                return filteredOrders.map(order => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    totalCents: order.totalCents,
                    createdAt: order.createdAt,
                    product: {
                        id: order.product.id,
                        name: order.product.name,
                        price: Number(order.product.price),
                    },
                    design: {
                        id: order.design.id,
                        prompt: order.design.prompt,
                        previewUrl: order.design.previewUrl,
                    },
                }));
            }
            catch (error) {
                this.logger.error(`Error fetching recent orders:`, error);
                throw error;
            }
        }
        /**
         * Obtient les statistiques de commandes
         */
        async getOrderStats(integrationId, period = 'week') {
            const cacheKey = `order_stats:${integrationId}:${period}`;
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
                // Query orders with metadata filter
                // Note: Prisma JSON field filtering requires proper typing
                const orders = await this.prisma.order.findMany({
                    where: {
                        metadata: {
                            path: ['integrationId'],
                            equals: integrationId,
                        },
                        createdAt: {
                            gte: startDate,
                            lte: now,
                        },
                    },
                    select: {
                        status: true,
                        totalCents: true,
                    },
                });
                const stats = {
                    period,
                    totalOrders: orders.length,
                    totalRevenue: orders.reduce((sum, order) => sum + order.totalCents, 0) / 100,
                    ordersByStatus: orders.reduce((acc, order) => {
                        acc[order.status] = (acc[order.status] || 0) + 1;
                        return acc;
                    }, {}),
                    averageOrderValue: orders.length > 0
                        ? orders.reduce((sum, order) => sum + order.totalCents, 0) / orders.length / 100
                        : 0,
                };
                await this.cache.setSimple(cacheKey, JSON.stringify(stats), 300);
                return stats;
            }
            catch (error) {
                this.logger.error(`Error getting order stats:`, error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "OrderSyncService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrderSyncService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrderSyncService = _classThis;
})();
exports.OrderSyncService = OrderSyncService;
