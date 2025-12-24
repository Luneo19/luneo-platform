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
exports.UsageTrackingService = void 0;
const common_1 = require("@nestjs/common");
/**
 * Service de tracking d'usage
 * Intercepte les événements métier et enregistre l'usage
 */
let UsageTrackingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UsageTrackingService = _classThis = class {
        constructor(prisma, cache, meteringService) {
            this.prisma = prisma;
            this.cache = cache;
            this.meteringService = meteringService;
            this.logger = new common_1.Logger(UsageTrackingService.name);
        }
        /**
         * Track la création d'un design
         */
        async trackDesignCreated(brandId, designId) {
            await this.meteringService.recordUsage(brandId, 'designs_created', 1, {
                designId,
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track un rendu 2D
         */
        async trackRender2D(brandId, designId, format) {
            await this.meteringService.recordUsage(brandId, 'renders_2d', 1, {
                designId,
                format,
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track un rendu 3D
         */
        async trackRender3D(brandId, designId, format) {
            await this.meteringService.recordUsage(brandId, 'renders_3d', 1, {
                designId,
                format,
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track un export GLTF
         */
        async trackExportGLTF(brandId, designId) {
            await this.meteringService.recordUsage(brandId, 'exports_gltf', 1, {
                designId,
                format: 'gltf',
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track un export USDZ
         */
        async trackExportUSDZ(brandId, designId) {
            await this.meteringService.recordUsage(brandId, 'exports_usdz', 1, {
                designId,
                format: 'usdz',
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track une génération IA
         */
        async trackAIGeneration(brandId, designId, model, cost) {
            await this.meteringService.recordUsage(brandId, 'ai_generations', 1, {
                designId,
                model,
                cost,
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track le stockage (GB)
         */
        async trackStorage(brandId, sizeGB) {
            await this.meteringService.recordUsage(brandId, 'storage_gb', sizeGB, {
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track la bande passante (GB)
         */
        async trackBandwidth(brandId, sizeGB) {
            await this.meteringService.recordUsage(brandId, 'bandwidth_gb', sizeGB, {
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track un appel API
         */
        async trackAPICall(brandId, endpoint, method) {
            await this.meteringService.recordUsage(brandId, 'api_calls', 1, {
                endpoint,
                method,
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Track une livraison de webhook
         */
        async trackWebhookDelivery(brandId, webhookId, topic) {
            await this.meteringService.recordUsage(brandId, 'webhook_deliveries', 1, {
                webhookId,
                topic,
                timestamp: new Date().toISOString(),
            });
        }
        /**
         * Calculer l'usage total de stockage pour un brand
         */
        async calculateTotalStorage(brandId) {
            try {
                const designs = await this.prisma.design.findMany({
                    where: { product: { brandId } },
                    select: {
                        previewUrl: true,
                        highResUrl: true,
                        // @ts-ignore - renderUrl exists in schema but Prisma client may need regeneration
                        renderUrl: true,
                    },
                });
                // Estimer la taille (en vrai, à calculer via S3)
                const estimatedSizeGB = designs.length * 0.01; // ~10MB par design
                // Mettre à jour le tracking
                await this.trackStorage(brandId, estimatedSizeGB);
                return estimatedSizeGB;
            }
            catch (error) {
                this.logger.error(`Failed to calculate storage: ${error.message}`, error.stack);
                return 0;
            }
        }
        /**
         * Récupérer les stats d'usage pour un brand
         */
        async getUsageStats(brandId, period) {
            try {
                const now = new Date();
                let startDate;
                switch (period) {
                    case 'day':
                        startDate = new Date(now);
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'month':
                        startDate = new Date(now);
                        startDate.setDate(1);
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'year':
                        startDate = new Date(now);
                        startDate.setMonth(0, 1);
                        startDate.setHours(0, 0, 0, 0);
                        break;
                }
                // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                const usageRecords = await this.prisma.usageMetric.findMany({
                    where: {
                        brandId,
                        timestamp: {
                            gte: startDate,
                        },
                    },
                });
                // Agréger par métrique
                const stats = {};
                for (const record of usageRecords) {
                    if (!stats[record.metric]) {
                        stats[record.metric] = { count: 0, total: 0 };
                    }
                    stats[record.metric].count++;
                    stats[record.metric].total += record.value;
                }
                return {
                    period,
                    startDate,
                    endDate: now,
                    metrics: stats,
                };
            }
            catch (error) {
                this.logger.error(`Failed to get usage stats: ${error.message}`, error.stack);
                throw error;
            }
        }
        /**
         * Récupérer l'historique d'usage
         */
        async getUsageHistory(brandId, metric, limit = 100) {
            try {
                const where = { brandId };
                if (metric) {
                    where.metric = metric;
                }
                // @ts-ignore - UsageMetric model exists but Prisma client may need regeneration
                const records = await this.prisma.usageMetric.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    take: limit,
                });
                return records;
            }
            catch (error) {
                this.logger.error(`Failed to get usage history: ${error.message}`, error.stack);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "UsageTrackingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsageTrackingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsageTrackingService = _classThis;
})();
exports.UsageTrackingService = UsageTrackingService;
