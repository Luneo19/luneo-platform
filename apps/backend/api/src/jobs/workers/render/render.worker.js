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
exports.RenderWorker = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
let RenderWorker = (() => {
    let _classDecorators = [(0, bull_1.Processor)('render-processing')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _render2D_decorators;
    let _render3D_decorators;
    let _renderPreview_decorators;
    let _exportAssets_decorators;
    let _batchRender_decorators;
    var RenderWorker = _classThis = class {
        constructor(prisma, cache, render2DService, render3DService, exportService, outboxService) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.cache = cache;
            this.render2DService = render2DService;
            this.render3DService = render3DService;
            this.exportService = exportService;
            this.outboxService = outboxService;
            this.logger = new common_1.Logger(RenderWorker.name);
        }
        async render2D(job) {
            const { renderId, productId, designId, options, priority, brandId, userId } = job.data;
            const startTime = Date.now();
            // Timeout: 60 secondes pour rendu 2D
            const timeout = setTimeout(() => {
                this.logger.error(`2D render timeout for ${renderId} after 60s`);
                job.moveToFailed(new Error('2D render timeout after 60s'), true);
            }, 60000);
            try {
                this.logger.log(`Starting 2D render for ${renderId}`);
                // Mettre à jour le progrès
                await this.updateRenderProgress(job, {
                    stage: 'initialization',
                    percentage: 10,
                    message: 'Initialisation du rendu 2D',
                    timestamp: new Date(),
                });
                // Créer la requête de rendu
                const renderRequest = {
                    id: renderId,
                    type: '2d',
                    productId,
                    designId,
                    options,
                    priority,
                };
                // Exécuter le rendu 2D
                await this.updateRenderProgress(job, {
                    stage: 'rendering',
                    percentage: 30,
                    message: 'Rendu 2D en cours',
                    timestamp: new Date(),
                });
                const result = await this.render2DService.render2D(renderRequest);
                // Finaliser le rendu
                await this.updateRenderProgress(job, {
                    stage: 'finalization',
                    percentage: 90,
                    message: 'Finalisation du rendu',
                    timestamp: new Date(),
                });
                // Sauvegarder les résultats
                await this.saveRenderResults(renderId, result, '2d');
                // Mettre à jour le progrès final
                await this.updateRenderProgress(job, {
                    stage: 'completed',
                    percentage: 100,
                    message: 'Rendu 2D terminé avec succès',
                    timestamp: new Date(),
                });
                const totalTime = Date.now() - startTime;
                this.logger.log(`2D render completed for ${renderId} in ${totalTime}ms`);
                clearTimeout(timeout);
                // Publier événement via Outbox
                await this.outboxService.publish('render.completed', {
                    renderId,
                    type: '2d',
                    brandId,
                    userId,
                    productId,
                    designId,
                    result,
                    renderTime: totalTime,
                    completedAt: new Date(),
                });
                return {
                    renderId,
                    status: 'success',
                    result,
                    renderTime: totalTime,
                };
            }
            catch (error) {
                clearTimeout(timeout);
                this.logger.error(`2D render failed for ${renderId}:`, error);
                await this.updateRenderProgress(job, {
                    stage: 'error',
                    percentage: 0,
                    message: `Erreur: ${error.message}`,
                    timestamp: new Date(),
                });
                await this.saveRenderError(renderId, error.message);
                // Publier événement d'erreur via Outbox
                await this.outboxService.publish('render.failed', {
                    renderId,
                    type: '2d',
                    brandId,
                    userId,
                    productId,
                    designId,
                    error: error.message,
                    failedAt: new Date(),
                });
                throw error;
            }
        }
        async render3D(job) {
            const { renderId, productId, designId, options, priority } = job.data;
            const startTime = Date.now();
            try {
                this.logger.log(`Starting 3D render for ${renderId}`);
                // Mettre à jour le progrès
                await this.updateRenderProgress(job, {
                    stage: 'initialization',
                    percentage: 10,
                    message: 'Initialisation du rendu 3D',
                    timestamp: new Date(),
                });
                // Créer la requête de rendu
                const renderRequest = {
                    id: renderId,
                    type: '3d',
                    productId,
                    designId,
                    options,
                    priority,
                };
                // Préparer la scène 3D
                await this.updateRenderProgress(job, {
                    stage: 'scene-preparation',
                    percentage: 25,
                    message: 'Préparation de la scène 3D',
                    timestamp: new Date(),
                });
                // Exécuter le rendu 3D
                await this.updateRenderProgress(job, {
                    stage: 'rendering',
                    percentage: 50,
                    message: 'Rendu 3D en cours',
                    timestamp: new Date(),
                });
                const result = await this.render3DService.render3D(renderRequest);
                // Post-traitement
                await this.updateRenderProgress(job, {
                    stage: 'post-processing',
                    percentage: 80,
                    message: 'Post-traitement 3D',
                    timestamp: new Date(),
                });
                // Sauvegarder les résultats
                await this.saveRenderResults(renderId, result, '3d');
                // Mettre à jour le progrès final
                await this.updateRenderProgress(job, {
                    stage: 'completed',
                    percentage: 100,
                    message: 'Rendu 3D terminé avec succès',
                    timestamp: new Date(),
                });
                const totalTime = Date.now() - startTime;
                this.logger.log(`3D render completed for ${renderId} in ${totalTime}ms`);
                return {
                    renderId,
                    status: 'success',
                    result,
                    renderTime: totalTime,
                };
            }
            catch (error) {
                this.logger.error(`3D render failed for ${renderId}:`, error);
                await this.updateRenderProgress(job, {
                    stage: 'error',
                    percentage: 0,
                    message: `Erreur: ${error.message}`,
                    timestamp: new Date(),
                });
                await this.saveRenderError(renderId, error.message);
                throw error;
            }
        }
        async renderPreview(job) {
            const { renderId, productId, designId, options, priority } = job.data;
            const startTime = Date.now();
            try {
                this.logger.log(`Starting preview render for ${renderId}`);
                // Optimiser les options pour la prévisualisation
                const previewOptions = {
                    ...options,
                    quality: 'draft',
                    width: Math.min(options.width || 800, 800),
                    height: Math.min(options.height || 600, 600),
                    antialiasing: false,
                    shadows: false,
                };
                // Choisir le type de rendu selon le produit
                const product = await this.getProduct(productId);
                const renderType = product?.model3dUrl ? '3d' : '2d';
                // Créer la requête de rendu
                const renderRequest = {
                    id: renderId,
                    type: renderType,
                    productId,
                    designId,
                    options: previewOptions,
                    priority,
                };
                // Exécuter le rendu
                let result;
                if (renderType === '3d') {
                    result = await this.render3DService.render3D(renderRequest);
                }
                else {
                    result = await this.render2DService.render2D(renderRequest);
                }
                // Sauvegarder les résultats
                await this.saveRenderResults(renderId, result, 'preview');
                const totalTime = Date.now() - startTime;
                this.logger.log(`Preview render completed for ${renderId} in ${totalTime}ms`);
                return {
                    renderId,
                    status: 'success',
                    result,
                    renderTime: totalTime,
                    type: renderType,
                };
            }
            catch (error) {
                this.logger.error(`Preview render failed for ${renderId}:`, error);
                await this.saveRenderError(renderId, error.message);
                throw error;
            }
        }
        async exportAssets(job) {
            const { renderId, productId, designId, options, priority } = job.data;
            const startTime = Date.now();
            try {
                this.logger.log(`Starting asset export for ${renderId}`);
                // Mettre à jour le progrès
                await this.updateRenderProgress(job, {
                    stage: 'initialization',
                    percentage: 10,
                    message: 'Initialisation de l\'export',
                    timestamp: new Date(),
                });
                // Récupérer les assets à exporter
                const assets = await this.getAssetsToExport(designId, productId);
                // Préparer l'export
                await this.updateRenderProgress(job, {
                    stage: 'preparation',
                    percentage: 30,
                    message: 'Préparation des assets',
                    timestamp: new Date(),
                });
                // Exécuter l'export
                await this.updateRenderProgress(job, {
                    stage: 'exporting',
                    percentage: 60,
                    message: 'Export en cours',
                    timestamp: new Date(),
                });
                const exportResult = await this.exportService.exportAssets(assets, options);
                // Finaliser l'export
                await this.updateRenderProgress(job, {
                    stage: 'finalization',
                    percentage: 90,
                    message: 'Finalisation de l\'export',
                    timestamp: new Date(),
                });
                // Sauvegarder les résultats
                await this.saveExportResults(renderId, exportResult);
                // Mettre à jour le progrès final
                await this.updateRenderProgress(job, {
                    stage: 'completed',
                    percentage: 100,
                    message: 'Export terminé avec succès',
                    timestamp: new Date(),
                });
                const totalTime = Date.now() - startTime;
                this.logger.log(`Asset export completed for ${renderId} in ${totalTime}ms`);
                return {
                    renderId,
                    status: 'success',
                    result: exportResult,
                    exportTime: totalTime,
                };
            }
            catch (error) {
                this.logger.error(`Asset export failed for ${renderId}:`, error);
                await this.updateRenderProgress(job, {
                    stage: 'error',
                    percentage: 0,
                    message: `Erreur: ${error.message}`,
                    timestamp: new Date(),
                });
                await this.saveRenderError(renderId, error.message);
                throw error;
            }
        }
        async batchRender(job) {
            const { batchId, renders } = job.data;
            const startTime = Date.now();
            try {
                this.logger.log(`Starting batch render for ${batchId} with ${renders.length} renders`);
                const results = [];
                let completed = 0;
                // Traiter les rendus en parallèle (limité)
                const concurrency = 3;
                const chunks = this.chunkArray(renders, concurrency);
                for (const chunk of chunks) {
                    const chunkPromises = chunk.map(async (renderData) => {
                        try {
                            let result;
                            switch (renderData.type) {
                                case '2d':
                                    result = await this.render2D({ data: renderData });
                                    break;
                                case '3d':
                                    result = await this.render3D({ data: renderData });
                                    break;
                                case 'preview':
                                    result = await this.renderPreview({ data: renderData });
                                    break;
                                case 'export':
                                    result = await this.exportAssets({ data: renderData });
                                    break;
                                default:
                                    throw new Error(`Unsupported render type: ${renderData.type}`);
                            }
                            completed++;
                            return result;
                        }
                        catch (error) {
                            this.logger.error(`Batch render failed for ${renderData.renderId}:`, error);
                            completed++;
                            return {
                                renderId: renderData.renderId,
                                status: 'failed',
                                error: error.message,
                            };
                        }
                    });
                    const chunkResults = await Promise.all(chunkPromises);
                    results.push(...chunkResults);
                    // Mettre à jour le progrès global
                    const progress = (completed / renders.length) * 100;
                    await this.updateBatchProgress(batchId, {
                        completed,
                        total: renders.length,
                        percentage: Math.round(progress),
                        results,
                    });
                }
                const totalTime = Date.now() - startTime;
                this.logger.log(`Batch render completed for ${batchId} in ${totalTime}ms`);
                return {
                    batchId,
                    status: 'completed',
                    results,
                    totalTime,
                };
            }
            catch (error) {
                this.logger.error(`Batch render failed for ${batchId}:`, error);
                throw error;
            }
        }
        /**
         * Met à jour le progrès du rendu
         */
        async updateRenderProgress(job, progress) {
            // Mettre à jour le progrès du job
            await job.progress({
                stage: progress.stage,
                percentage: progress.percentage,
                message: progress.message,
                timestamp: progress.timestamp,
            });
            // Sauvegarder en base
            await this.prisma.renderProgress.upsert({
                where: { renderId: job.data.renderId },
                update: progress,
                create: {
                    renderId: job.data.renderId,
                    ...progress,
                },
            });
        }
        /**
         * Met à jour le progrès du batch
         */
        async updateBatchProgress(batchId, progress) {
            await this.prisma.batchRenderProgress.upsert({
                where: { batchId },
                update: progress,
                create: {
                    batchId,
                    ...progress,
                },
            });
        }
        /**
         * Sauvegarde les résultats du rendu
         */
        async saveRenderResults(renderId, result, type) {
            await this.prisma.renderResult.create({
                data: {
                    renderId,
                    type,
                    status: result.status,
                    url: result.url,
                    thumbnailUrl: result.thumbnailUrl,
                    metadata: result.metadata,
                    createdAt: new Date(),
                },
            });
        }
        /**
         * Sauvegarde les résultats de l'export
         */
        async saveExportResults(renderId, result) {
            await this.prisma.exportResult.create({
                data: {
                    renderId,
                    format: result.format,
                    url: result.url,
                    size: result.size,
                    metadata: result.metadata,
                    createdAt: new Date(),
                },
            });
        }
        /**
         * Sauvegarde les erreurs de rendu
         */
        async saveRenderError(renderId, error) {
            await this.prisma.renderError.create({
                data: {
                    renderId,
                    error,
                    occurredAt: new Date(),
                },
            });
        }
        /**
         * Récupère un produit
         */
        async getProduct(productId) {
            return this.prisma.product.findUnique({
                where: { id: productId },
                select: {
                    id: true,
                    name: true,
                    model3dUrl: true,
                    // @ts-ignore - baseAssetUrl exists in schema but Prisma client may need regeneration
                    baseAssetUrl: true,
                    images: true,
                },
            });
        }
        /**
         * Récupère les assets à exporter
         */
        async getAssetsToExport(designId, productId) {
            if (designId) {
                // @ts-ignore - asset exists in schema but Prisma client may need regeneration
                return this.prisma.asset.findMany({
                    where: { designId },
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        metadata: true,
                    },
                });
            }
            if (productId) {
                const product = await this.getProduct(productId);
                return [{
                        id: product.id,
                        url: product.baseAssetUrl,
                        type: 'image',
                        metaJson: { source: 'product' },
                    }];
            }
            return [];
        }
        /**
         * Divise un tableau en chunks
         */
        chunkArray(array, size) {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        }
        /**
         * Obtient les métriques de rendu
         */
        async getRenderMetrics() {
            const cacheKey = 'render_worker_metrics';
            const cached = await this.cache.getSimple(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            try {
                // Statistiques des 24 dernières heures
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const totalRenders = await this.prisma.renderResult.count({
                    where: { createdAt: { gte: yesterday } },
                });
                const successfulRenders = await this.prisma.renderResult.count({
                    where: {
                        status: 'success',
                        createdAt: { gte: yesterday },
                    },
                });
                const failedRenders = await this.prisma.renderResult.count({
                    where: {
                        status: 'failed',
                        createdAt: { gte: yesterday },
                    },
                });
                const rendersByType = await this.prisma.renderResult.groupBy({
                    by: ['type'],
                    where: { createdAt: { gte: yesterday } },
                    _count: { type: true },
                });
                const metrics = {
                    totalRenders,
                    successfulRenders,
                    failedRenders,
                    successRate: totalRenders > 0 ? (successfulRenders / totalRenders) * 100 : 0,
                    rendersByType: rendersByType.reduce((acc, item) => {
                        acc[item.type] = item._count.type;
                        return acc;
                    }, {}),
                    lastUpdated: new Date(),
                };
                // Mettre en cache pour 5 minutes
                await this.cache.setSimple(cacheKey, JSON.stringify(metrics), 300);
                return metrics;
            }
            catch (error) {
                this.logger.error('Error getting render metrics:', error);
                throw error;
            }
        }
    };
    __setFunctionName(_classThis, "RenderWorker");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _render2D_decorators = [(0, bull_1.Process)('render-2d')];
        _render3D_decorators = [(0, bull_1.Process)('render-3d')];
        _renderPreview_decorators = [(0, bull_1.Process)('render-preview')];
        _exportAssets_decorators = [(0, bull_1.Process)('export-assets')];
        _batchRender_decorators = [(0, bull_1.Process)('batch-render')];
        __esDecorate(_classThis, null, _render2D_decorators, { kind: "method", name: "render2D", static: false, private: false, access: { has: obj => "render2D" in obj, get: obj => obj.render2D }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _render3D_decorators, { kind: "method", name: "render3D", static: false, private: false, access: { has: obj => "render3D" in obj, get: obj => obj.render3D }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _renderPreview_decorators, { kind: "method", name: "renderPreview", static: false, private: false, access: { has: obj => "renderPreview" in obj, get: obj => obj.renderPreview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportAssets_decorators, { kind: "method", name: "exportAssets", static: false, private: false, access: { has: obj => "exportAssets" in obj, get: obj => obj.exportAssets }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _batchRender_decorators, { kind: "method", name: "batchRender", static: false, private: false, access: { has: obj => "batchRender" in obj, get: obj => obj.batchRender }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RenderWorker = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RenderWorker = _classThis;
})();
exports.RenderWorker = RenderWorker;
