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
exports.Render2DService = void 0;
const common_1 = require("@nestjs/common");
let Render2DService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Render2DService = _classThis = class {
        constructor(prisma, storageService, cache) {
            this.prisma = prisma;
            this.storageService = storageService;
            this.cache = cache;
            this.logger = new common_1.Logger(Render2DService.name);
            this.sharpModule = null;
        }
        /**
         * Lazy load sharp module to reduce cold start time
         */
        async getSharp() {
            if (!this.sharpModule) {
                this.sharpModule = await Promise.resolve().then(() => __importStar(require('sharp')));
                // Handle both ESM and CommonJS exports
                if (this.sharpModule.default) {
                    this.sharpModule = this.sharpModule.default;
                }
            }
            return this.sharpModule;
        }
        /**
         * Rend un design 2D
         */
        async render2D(request) {
            const startTime = Date.now();
            try {
                this.logger.log(`Starting 2D render for request ${request.id}`);
                // Valider la requête
                const validation = await this.validateRenderRequest(request);
                if (!validation.isValid) {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
                // Récupérer les données du design
                const designData = await this.getDesignData(request.productId, request.designId);
                // Créer le canvas
                const canvas = await this.createCanvas(request.options);
                // Appliquer les éléments du design
                const processedCanvas = await this.applyDesignElements(canvas, designData, request.options);
                // Finaliser le rendu
                const finalImage = await this.finalizeRender(processedCanvas, request.options);
                // Uploader vers S3
                const uploadResult = await this.uploadRender(finalImage, request);
                // Créer la thumbnail
                const thumbnailUrl = await this.createThumbnail(finalImage, request);
                const renderTime = Date.now() - startTime;
                const result = {
                    id: request.id,
                    status: 'success',
                    url: typeof uploadResult === 'string' ? uploadResult : uploadResult.url,
                    thumbnailUrl,
                    metadata: {
                        width: request.options.width,
                        height: request.options.height,
                        format: request.options.format || 'png',
                        size: uploadResult.size,
                        renderTime,
                        quality: request.options.quality || 'standard',
                    },
                    createdAt: new Date(),
                    completedAt: new Date(),
                };
                // Mettre en cache le résultat
                await this.cache.setSimple(`render_result:${request.id}`, JSON.stringify(result), 3600);
                this.logger.log(`2D render completed for request ${request.id} in ${renderTime}ms`);
                return result;
            }
            catch (error) {
                this.logger.error(`2D render failed for request ${request.id}:`, error);
                return {
                    id: request.id,
                    status: 'failed',
                    error: error.message,
                    createdAt: new Date(),
                };
            }
        }
        /**
         * Valide une requête de rendu
         */
        async validateRenderRequest(request) {
            const errors = [];
            const warnings = [];
            const suggestions = [];
            // Vérifier les dimensions
            if (request.options.width <= 0 || request.options.height <= 0) {
                errors.push('Dimensions must be positive');
            }
            if (request.options.width > 8000 || request.options.height > 8000) {
                warnings.push('Very large dimensions may cause performance issues');
                suggestions.push('Consider reducing dimensions or using a lower quality setting');
            }
            // Vérifier le format
            const supportedFormats = ['png', 'jpg', 'webp', 'svg'];
            if (request.options.format && !supportedFormats.includes(request.options.format)) {
                errors.push(`Unsupported format: ${request.options.format}`);
            }
            // Vérifier la qualité
            const supportedQualities = ['draft', 'standard', 'high', 'ultra'];
            if (request.options.quality && !supportedQualities.includes(request.options.quality)) {
                errors.push(`Unsupported quality: ${request.options.quality}`);
            }
            // Vérifier le DPI
            if (request.options.dpi && (request.options.dpi < 72 || request.options.dpi > 300)) {
                warnings.push('DPI outside recommended range (72-300)');
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                suggestions,
            };
        }
        /**
         * Récupère les données du design
         */
        async getDesignData(productId, designId) {
            if (designId) {
                const design = await this.prisma.design.findUnique({
                    where: { id: designId },
                    select: {
                        options: true,
                        assets: {
                            select: {
                                url: true,
                                type: true,
                                format: true,
                            },
                        },
                    },
                });
                if (!design) {
                    throw new Error(`Design ${designId} not found`);
                }
                return {
                    options: design.options || { width: 800, height: 600 },
                    assets: design.assets,
                };
            }
            // Récupérer le produit par défaut
            const product = await this.prisma.product.findUnique({
                where: { id: productId },
                select: {
                    baseAssetUrl: true,
                    images: true,
                },
            });
            if (!product) {
                throw new Error(`Product ${productId} not found`);
            }
            return {
                baseAsset: product.baseAssetUrl || undefined,
                images: product.images,
                options: { width: 800, height: 600 },
            };
        }
        /**
         * Crée un canvas de base
         */
        async createCanvas(options) {
            const { width, height, backgroundColor = '#ffffff', dpi = 72 } = options;
            const sharp = await this.getSharp();
            // Créer un canvas vide
            const canvas = sharp({
                create: {
                    width,
                    height,
                    channels: 4,
                    background: backgroundColor,
                },
            });
            // Appliquer le DPI si spécifié
            if (dpi !== 72) {
                canvas.withMetadata({ density: dpi });
            }
            return canvas;
        }
        /**
         * Applique les éléments du design au canvas
         */
        async applyDesignElements(canvas, designData, options) {
            let processedCanvas = canvas;
            // Appliquer l'image de base si disponible
            const baseAsset = designData.baseAsset;
            if (baseAsset && typeof baseAsset === 'string') {
                processedCanvas = await this.applyBaseImage(processedCanvas, baseAsset, options);
            }
            // Appliquer les zones personnalisées
            const designOptions = designData.options;
            if (designOptions?.zones) {
                processedCanvas = await this.applyZones(processedCanvas, designOptions.zones, options);
            }
            // Appliquer les effets
            if (designOptions?.effects) {
                processedCanvas = await this.applyEffects(processedCanvas, designOptions.effects);
            }
            return processedCanvas;
        }
        /**
         * Applique l'image de base
         */
        async applyBaseImage(canvas, baseAssetUrl, options) {
            try {
                const sharp = await this.getSharp();
                // Télécharger l'image de base
                const baseImage = await this.downloadAsset(baseAssetUrl);
                // Redimensionner l'image de base pour s'adapter au canvas
                const resizedBase = await sharp(baseImage)
                    .resize(options.width, options.height, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 },
                })
                    .png()
                    .toBuffer();
                // Composer l'image de base avec le canvas
                return canvas.composite([{
                        input: resizedBase,
                        blend: 'over',
                    }]);
            }
            catch (error) {
                this.logger.warn(`Failed to apply base image: ${error.message}`);
                return canvas;
            }
        }
        /**
         * Applique les zones personnalisées
         */
        async applyZones(canvas, zones, options) {
            let processedCanvas = canvas;
            for (const [zoneId, zoneData] of Object.entries(zones)) {
                try {
                    processedCanvas = await this.applyZone(processedCanvas, zoneId, zoneData, options);
                }
                catch (error) {
                    this.logger.warn(`Failed to apply zone ${zoneId}: ${error.message}`);
                }
            }
            return processedCanvas;
        }
        /**
         * Applique une zone spécifique
         */
        async applyZone(canvas, zoneId, zoneData, options) {
            if (zoneData.type === 'image' && zoneData.imageUrl) {
                return this.applyImageZone(canvas, zoneData);
            }
            else if (zoneData.type === 'text') {
                return this.applyTextZone(canvas, zoneData);
            }
            else if (zoneData.type === 'color') {
                return this.applyColorZone(canvas, zoneData);
            }
            return canvas;
        }
        /**
         * Applique une zone image
         */
        async applyImageZone(canvas, zoneData) {
            try {
                const sharp = await this.getSharp();
                const imageBuffer = await this.downloadAsset(zoneData.imageUrl);
                const positionedImage = await sharp(imageBuffer)
                    .resize(zoneData.width || 200, zoneData.height || 200, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                    .png()
                    .toBuffer();
                return canvas.composite([{
                        input: positionedImage,
                        left: zoneData.x || 0,
                        top: zoneData.y || 0,
                        blend: 'over',
                    }]);
            }
            catch (error) {
                this.logger.warn(`Failed to apply image zone: ${error.message}`);
                return canvas;
            }
        }
        /**
         * Applique une zone texte
         */
        async applyTextZone(canvas, zoneData) {
            // Pour le texte, nous créons une image SVG temporaire
            const svgText = this.createTextSVG(zoneData);
            try {
                const sharp = await this.getSharp();
                const textBuffer = await sharp(Buffer.from(svgText))
                    .png()
                    .toBuffer();
                return canvas.composite([{
                        input: textBuffer,
                        left: zoneData.x || 0,
                        top: zoneData.y || 0,
                        blend: 'over',
                    }]);
            }
            catch (error) {
                this.logger.warn(`Failed to apply text zone: ${error.message}`);
                return canvas;
            }
        }
        /**
         * Applique une zone couleur
         */
        async applyColorZone(canvas, zoneData) {
            const sharp = await this.getSharp();
            const colorOverlay = await sharp({
                create: {
                    width: zoneData.width || 100,
                    height: zoneData.height || 100,
                    channels: 4,
                    background: zoneData.color || '#000000',
                },
            }).png().toBuffer();
            return canvas.composite([{
                    input: colorOverlay,
                    left: zoneData.x || 0,
                    top: zoneData.y || 0,
                    blend: zoneData.blend || 'over',
                    // opacity: zoneData.opacity || 1, // Commenté car pas dans OverlayOptions
                }]);
        }
        /**
         * Applique les effets
         */
        async applyEffects(canvas, effects) {
            let processedCanvas = canvas;
            for (const effect of effects) {
                switch (effect.type) {
                    case 'blur':
                        processedCanvas = processedCanvas.blur(effect.intensity || 1);
                        break;
                    case 'sharpen':
                        processedCanvas = processedCanvas.sharpen();
                        break;
                    case 'brightness':
                        processedCanvas = processedCanvas.modulate({
                            brightness: effect.value || 1,
                        });
                        break;
                    case 'contrast':
                        processedCanvas = processedCanvas.modulate({
                            saturation: effect.value || 1,
                        });
                        break;
                    case 'hue':
                        processedCanvas = processedCanvas.modulate({
                            hue: effect.value || 0,
                        });
                        break;
                    case 'grayscale':
                        processedCanvas = processedCanvas.grayscale();
                        break;
                    case 'sepia':
                        // processedCanvas = processedCanvas.sepia(); // Commenté car pas dans Sharp
                        break;
                    case 'vintage':
                        processedCanvas = processedCanvas.modulate({
                            brightness: 0.8,
                            saturation: 0.7,
                            hue: 10,
                        }).sharpen();
                        break;
                }
            }
            return processedCanvas;
        }
        /**
         * Finalise le rendu
         */
        async finalizeRender(canvas, options) {
            const format = options.format || 'png';
            const quality = this.getQualityValue(options.quality);
            switch (format) {
                case 'jpg':
                case 'jpeg':
                    return canvas
                        .jpeg({ quality, progressive: true })
                        .toBuffer();
                case 'webp':
                    return canvas
                        .webp({ quality })
                        .toBuffer();
                case 'svg':
                    // Pour SVG, nous retournons le canvas PNG car Sharp ne génère pas de SVG
                    return canvas
                        .png({ quality: 100 })
                        .toBuffer();
                default:
                    return canvas
                        .png({ quality })
                        .toBuffer();
            }
        }
        /**
         * Obtient la valeur de qualité
         */
        getQualityValue(quality) {
            switch (quality) {
                case 'draft': return 60;
                case 'standard': return 80;
                case 'high': return 90;
                case 'ultra': return 95;
                default: return 80;
            }
        }
        /**
         * Upload le rendu vers S3
         */
        async uploadRender(imageBuffer, request) {
            const filename = `renders/2d/${request.id}.${request.options.format || 'png'}`;
            const uploadResult = await this.storageService.uploadBuffer(imageBuffer, filename, {
                contentType: this.getContentType(request.options.format || 'png'),
                metadata: {
                    renderId: request.id,
                    type: '2d-render',
                    quality: request.options.quality || 'standard',
                },
            });
            return {
                url: uploadResult,
                size: imageBuffer.length,
            };
        }
        /**
         * Crée une thumbnail
         */
        async createThumbnail(imageBuffer, request) {
            const sharp = await this.getSharp();
            const thumbnailBuffer = await sharp(imageBuffer)
                .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .png()
                .toBuffer();
            const filename = `thumbnails/2d/${request.id}.png`;
            const uploadResult = await this.storageService.uploadBuffer(thumbnailBuffer, filename, {
                contentType: 'image/png',
                metadata: {
                    renderId: request.id,
                    type: '2d-thumbnail',
                },
            });
            return uploadResult;
        }
        /**
         * Télécharge un asset
         */
        async downloadAsset(url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download asset: ${response.statusText}`);
            }
            return Buffer.from(await response.arrayBuffer());
        }
        /**
         * Crée un SVG pour le texte
         */
        createTextSVG(zoneData) {
            const { text = 'Sample Text', font = 'Arial', fontSize = 16, color = '#000000' } = zoneData;
            return `
      <svg width="${zoneData.width || 200}" height="${zoneData.height || 50}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" font-family="${font}" font-size="${fontSize}" fill="${color}" 
              text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;
        }
        /**
         * Obtient le type de contenu
         */
        getContentType(format) {
            switch (format) {
                case 'jpg':
                case 'jpeg': return 'image/jpeg';
                case 'webp': return 'image/webp';
                case 'svg': return 'image/svg+xml';
                default: return 'image/png';
            }
        }
        /**
         * Obtient les métriques de rendu
         */
        async getRenderMetrics() {
            const cacheKey = 'render_metrics:2d';
            const cached = await this.cache.getSimple(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            try {
                // Statistiques des 24 dernières heures
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const totalRenders = await this.prisma.design.count({
                    where: {
                        createdAt: { gte: yesterday },
                    },
                });
                const successfulRenders = await this.prisma.design.count({
                    where: {
                        status: 'COMPLETED',
                        createdAt: { gte: yesterday },
                    },
                });
                const failedRenders = await this.prisma.design.count({
                    where: {
                        status: 'FAILED',
                        createdAt: { gte: yesterday },
                    },
                });
                const metrics = {
                    totalRenders,
                    successfulRenders,
                    failedRenders,
                    successRate: totalRenders > 0 ? (successfulRenders / totalRenders) * 100 : 0,
                    averageRenderTime: 1500, // Simulation
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
    __setFunctionName(_classThis, "Render2DService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Render2DService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Render2DService = _classThis;
})();
exports.Render2DService = Render2DService;
