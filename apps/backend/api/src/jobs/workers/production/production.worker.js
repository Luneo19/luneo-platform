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
exports.ProductionWorker = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
let ProductionWorker = (() => {
    let _classDecorators = [(0, bull_1.Processor)('production-processing')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createProductionBundle_decorators;
    let _qualityControl_decorators;
    let _trackProduction_decorators;
    let _generateManufacturingInstructions_decorators;
    var ProductionWorker = _classThis = class {
        constructor(prisma, cache, storageService, outboxService) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.cache = cache;
            this.storageService = storageService;
            this.outboxService = outboxService;
            this.logger = new common_1.Logger(ProductionWorker.name);
        }
        async createProductionBundle(job) {
            const { orderId, brandId, designId, productId, quantity, options } = job.data;
            const startTime = Date.now();
            // Timeout: 120 secondes pour production bundle
            const timeout = setTimeout(() => {
                this.logger.error(`Production bundle timeout for order ${orderId} after 120s`);
                job.moveToFailed(new Error('Production bundle timeout after 120s'), true);
            }, 120000);
            try {
                this.logger.log(`Creating production bundle for order ${orderId}`);
                // Mettre à jour le statut de la commande
                await this.updateOrderStatus(orderId, 'PROCESSING');
                // Récupérer les données nécessaires
                const [order, design, product, brand] = await Promise.all([
                    this.getOrder(orderId),
                    this.getDesign(designId),
                    this.getProduct(productId),
                    this.getBrand(brandId),
                ]);
                // Valider les données
                await this.validateProductionData(order, design, product, brand);
                // Générer les fichiers de production
                const productionFiles = await this.generateProductionFiles(design, product, options);
                // Créer les instructions de production
                const instructions = await this.createProductionInstructions(order, design, product, options);
                // Créer le bundle de production
                const bundle = {
                    orderId,
                    files: productionFiles,
                    instructions,
                    metadata: {
                        brandId,
                        productId,
                        designId,
                        createdAt: new Date(),
                        version: '1.0',
                    },
                };
                // Uploader le bundle vers S3
                const bundleUrl = await this.uploadProductionBundle(bundle);
                // Mettre à jour la commande avec le bundle
                await this.updateOrderWithBundle(orderId, bundleUrl);
                // Envoyer le webhook à l'usine si configuré
                if (job.data.factoryWebhookUrl) {
                    await this.sendFactoryWebhook(job.data.factoryWebhookUrl, bundle, orderId);
                }
                // Mettre à jour le statut final
                await this.updateOrderStatus(orderId, 'READY_FOR_PRODUCTION');
                const totalTime = Date.now() - startTime;
                this.logger.log(`Production bundle created for order ${orderId} in ${totalTime}ms`);
                clearTimeout(timeout);
                // Publier événement via Outbox
                await this.outboxService.publish('production.bundle.created', {
                    orderId,
                    brandId,
                    designId,
                    productId,
                    bundleUrl,
                    processingTime: totalTime,
                    completedAt: new Date(),
                });
                return {
                    orderId,
                    status: 'success',
                    bundleUrl,
                    processingTime: totalTime,
                };
            }
            catch (error) {
                clearTimeout(timeout);
                this.logger.error(`Production bundle creation failed for order ${orderId}:`, error);
                await this.updateOrderStatus(orderId, 'PRODUCTION_FAILED', error.message);
                // Publier événement d'erreur via Outbox
                await this.outboxService.publish('production.bundle.failed', {
                    orderId,
                    brandId,
                    designId,
                    productId,
                    error: error.message,
                    failedAt: new Date(),
                });
                throw error;
            }
        }
        async qualityControl(job) {
            const { orderId, designId, productId } = job.data;
            try {
                this.logger.log(`Starting quality control for order ${orderId}`);
                // Récupérer les assets du design
                // @ts-ignore - asset exists in schema but Prisma client may need regeneration
                const assets = await this.prisma.asset.findMany({
                    where: { designId },
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        metadata: true,
                    },
                });
                // Vérifier la qualité de chaque asset
                const qualityChecks = await Promise.all(assets.map(asset => this.checkAssetQuality(asset)));
                // Analyser les résultats
                const qualityReport = this.analyzeQualityChecks(qualityChecks);
                // Sauvegarder le rapport de qualité
                await this.saveQualityReport(orderId, qualityReport);
                // Décider si la production peut continuer
                if (qualityReport.overallScore < 0.8) {
                    await this.updateOrderStatus(orderId, 'QUALITY_ISSUE', 'Quality control failed');
                    throw new Error(`Quality control failed: ${qualityReport.issues.join(', ')}`);
                }
                this.logger.log(`Quality control passed for order ${orderId}`);
                return {
                    orderId,
                    status: 'quality_passed',
                    qualityReport,
                };
            }
            catch (error) {
                this.logger.error(`Quality control failed for order ${orderId}:`, error);
                throw error;
            }
        }
        async trackProduction(job) {
            const { orderId, factoryId } = job.data;
            try {
                this.logger.log(`Tracking production for order ${orderId}`);
                // Simuler le suivi de production
                const productionStages = [
                    { stage: 'received', message: 'Commande reçue par l\'usine', percentage: 10 },
                    { stage: 'materials', message: 'Préparation des matériaux', percentage: 25 },
                    { stage: 'production', message: 'Production en cours', percentage: 60 },
                    { stage: 'quality', message: 'Contrôle qualité', percentage: 80 },
                    { stage: 'packaging', message: 'Emballage', percentage: 95 },
                    { stage: 'shipped', message: 'Expédié', percentage: 100 },
                ];
                // Mettre à jour le statut de production
                for (const stage of productionStages) {
                    await this.updateProductionStatus(orderId, stage.stage, stage.message, stage.percentage);
                    // Simuler un délai entre les étapes
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                // Finaliser la production
                await this.updateOrderStatus(orderId, 'SHIPPED');
                this.logger.log(`Production tracking completed for order ${orderId}`);
                return {
                    orderId,
                    status: 'production_completed',
                    stages: productionStages,
                };
            }
            catch (error) {
                this.logger.error(`Production tracking failed for order ${orderId}:`, error);
                throw error;
            }
        }
        async generateManufacturingInstructions(job) {
            const { orderId, designId, productId, quantity, options } = job.data;
            try {
                this.logger.log(`Generating manufacturing instructions for order ${orderId}`);
                // Récupérer les données
                const [design, product] = await Promise.all([
                    this.getDesign(designId),
                    this.getProduct(productId),
                ]);
                // Générer les instructions détaillées
                const instructions = {
                    orderId,
                    product: {
                        name: product.name,
                        sku: product.sku,
                        baseSpecifications: product.specifications || {},
                    },
                    design: {
                        customizations: design.optionsJson,
                        zones: this.extractZonesFromDesign(design),
                    },
                    manufacturing: {
                        quantity,
                        materials: options.materials || [],
                        finishes: options.finishes || [],
                        qualityLevel: options.qualityLevel || 'standard',
                        specialRequirements: options.specialRequirements || [],
                    },
                    quality: {
                        standards: ['ISO 9001', 'CE'],
                        checkpoints: this.generateQualityCheckpoints(design, product),
                        tolerances: this.calculateTolerances(product, options),
                    },
                    packaging: {
                        requirements: this.generatePackagingRequirements(product, quantity),
                        labeling: this.generateLabelingRequirements(orderId, product, design),
                    },
                };
                // Créer le document d'instructions
                const instructionsDocument = await this.createInstructionsDocument(instructions);
                // Uploader les instructions
                const instructionsUrl = await this.uploadInstructions(instructionsDocument, orderId);
                // Sauvegarder la référence
                await this.saveInstructionsReference(orderId, instructionsUrl);
                this.logger.log(`Manufacturing instructions generated for order ${orderId}`);
                return {
                    orderId,
                    status: 'instructions_generated',
                    instructionsUrl,
                };
            }
            catch (error) {
                this.logger.error(`Manufacturing instructions generation failed for order ${orderId}:`, error);
                throw error;
            }
        }
        /**
         * Récupère une commande
         */
        async getOrder(orderId) {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    design: true,
                    product: true,
                    brand: true,
                },
            });
            if (!order) {
                throw new Error(`Order ${orderId} not found`);
            }
            return order;
        }
        /**
         * Récupère un design
         */
        async getDesign(designId) {
            const design = await this.prisma.design.findUnique({
                where: { id: designId },
                // @ts-ignore - assets relation exists in schema but Prisma client may need regeneration
                include: {
                    assets: true,
                },
            });
            if (!design) {
                throw new Error(`Design ${designId} not found`);
            }
            return design;
        }
        /**
         * Récupère un produit
         */
        async getProduct(productId) {
            const product = await this.prisma.product.findUnique({
                where: { id: productId },
            });
            if (!product) {
                throw new Error(`Product ${productId} not found`);
            }
            return product;
        }
        /**
         * Récupère une marque
         */
        async getBrand(brandId) {
            const brand = await this.prisma.brand.findUnique({
                where: { id: brandId },
            });
            if (!brand) {
                throw new Error(`Brand ${brandId} not found`);
            }
            return brand;
        }
        /**
         * Valide les données de production
         */
        async validateProductionData(order, design, product, brand) {
            if (order.status !== 'PAID') {
                throw new Error('Order must be paid before production');
            }
            if (design.status !== 'COMPLETED') {
                throw new Error('Design must be completed before production');
            }
            if (!product.isActive) {
                throw new Error('Product is not active');
            }
            if (brand.status !== 'ACTIVE') {
                throw new Error('Brand is not active');
            }
        }
        /**
         * Génère les fichiers de production
         */
        async generateProductionFiles(design, product, options) {
            const files = [];
            // Fichiers du design
            for (const asset of design.assets) {
                files.push({
                    filename: `design_${asset.id}.${asset.type}`,
                    url: asset.url,
                    type: 'design',
                    format: asset.type,
                    size: asset.metaJson?.size || 0,
                });
            }
            // Fichiers de spécifications
            if (product.baseAssetUrl) {
                files.push({
                    filename: 'product_specifications.png',
                    url: product.baseAssetUrl,
                    type: 'instructions',
                    format: 'png',
                    size: 0,
                });
            }
            return files;
        }
        /**
         * Crée les instructions de production
         */
        async createProductionInstructions(order, design, product, options) {
            return {
                quantity: order.quantity,
                materials: options.materials || ['standard'],
                finishes: options.finishes || ['standard'],
                specialInstructions: options.specialInstructions || [],
                qualityLevel: options.qualityLevel || 'standard',
                deadline: this.calculateDeadline(order.createdAt, product.productionTime || 5),
            };
        }
        /**
         * Calcule la deadline
         */
        calculateDeadline(orderDate, productionDays) {
            const deadline = new Date(orderDate);
            deadline.setDate(deadline.getDate() + productionDays);
            return deadline;
        }
        /**
         * Upload le bundle de production
         */
        async uploadProductionBundle(bundle) {
            const bundleData = JSON.stringify(bundle, null, 2);
            const filename = `production-bundles/${bundle.orderId}/bundle.json`;
            const uploadResult = await this.storageService.uploadBuffer(Buffer.from(bundleData), filename, {
                contentType: 'application/json',
                metadata: {
                    orderId: bundle.orderId,
                    type: 'production-bundle',
                    version: bundle.metadata.version,
                },
            });
            return uploadResult;
        }
        /**
         * Met à jour la commande avec le bundle
         */
        async updateOrderWithBundle(orderId, bundleUrl) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    // @ts-ignore - productionBundleUrl exists in schema but Prisma client may need regeneration
                    productionBundleUrl: bundleUrl,
                    metadata: {
                        bundleGeneratedAt: new Date(),
                    },
                },
            });
        }
        /**
         * Envoie le webhook à l'usine
         */
        async sendFactoryWebhook(webhookUrl, bundle, orderId) {
            try {
                const payload = {
                    orderId,
                    bundleUrl: bundle.files[0]?.url, // URL du bundle principal
                    instructions: bundle.instructions,
                    metadata: bundle.metadata,
                    timestamp: new Date().toISOString(),
                };
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Luneo-Signature': this.generateWebhookSignature(payload),
                    },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    throw new Error(`Webhook failed: ${response.statusText}`);
                }
                this.logger.log(`Factory webhook sent successfully for order ${orderId}`);
            }
            catch (error) {
                this.logger.error(`Factory webhook failed for order ${orderId}:`, error);
                // Ne pas faire échouer le job pour une erreur de webhook
            }
        }
        /**
         * Génère la signature du webhook
         */
        generateWebhookSignature(payload) {
            // Simulation de signature HMAC
            // En production, utiliser crypto.createHmac
            return `sha256=${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
        }
        /**
         * Met à jour le statut de la commande
         */
        async updateOrderStatus(orderId, status, error) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: status,
                    ...(error && { metadata: { error, updatedAt: new Date() } }),
                },
            });
        }
        /**
         * Met à jour le statut de production
         */
        async updateProductionStatus(orderId, stage, message, percentage) {
            await this.prisma.productionStatus.upsert({
                where: { orderId },
                update: {
                    currentStage: stage,
                    message,
                    percentage,
                    lastUpdated: new Date(),
                },
                create: {
                    orderId,
                    currentStage: stage,
                    message,
                    percentage,
                    lastUpdated: new Date(),
                },
            });
        }
        /**
         * Vérifie la qualité d'un asset
         */
        async checkAssetQuality(asset) {
            // Simulation de vérification de qualité
            const qualityScore = Math.random() * 0.4 + 0.6; // Score entre 0.6 et 1.0
            return {
                assetId: asset.id,
                qualityScore,
                issues: qualityScore < 0.8 ? ['Low resolution', 'Poor contrast'] : [],
                recommendations: qualityScore < 0.9 ? ['Improve contrast', 'Increase resolution'] : [],
            };
        }
        /**
         * Analyse les vérifications de qualité
         */
        analyzeQualityChecks(qualityChecks) {
            const overallScore = qualityChecks.reduce((sum, check) => sum + check.qualityScore, 0) / qualityChecks.length;
            const allIssues = qualityChecks.flatMap(check => check.issues);
            const allRecommendations = qualityChecks.flatMap(check => check.recommendations);
            return {
                overallScore,
                issues: allIssues,
                recommendations: allRecommendations,
                passed: overallScore >= 0.8,
                assetCount: qualityChecks.length,
            };
        }
        /**
         * Sauvegarde le rapport de qualité
         */
        async saveQualityReport(orderId, qualityReport) {
            await this.prisma.qualityReport.create({
                data: {
                    orderId,
                    overallScore: qualityReport.overallScore,
                    issues: qualityReport.issues,
                    recommendations: qualityReport.recommendations,
                    passed: qualityReport.passed,
                    createdAt: new Date(),
                },
            });
        }
        /**
         * Extrait les zones du design
         */
        extractZonesFromDesign(design) {
            if (!design.optionsJson?.zones)
                return [];
            return Object.entries(design.optionsJson.zones).map(([id, data]) => ({
                id,
                ...data,
            }));
        }
        /**
         * Génère les points de contrôle qualité
         */
        generateQualityCheckpoints(design, product) {
            return [
                'Material verification',
                'Dimensional accuracy',
                'Color matching',
                'Surface finish',
                'Assembly integrity',
            ];
        }
        /**
         * Calcule les tolérances
         */
        calculateTolerances(product, options) {
            return {
                dimensions: options.qualityLevel === 'premium' ? 0.1 : 0.2,
                color: options.qualityLevel === 'premium' ? 5 : 10,
                finish: options.qualityLevel === 'premium' ? 1 : 2,
            };
        }
        /**
         * Génère les exigences d'emballage
         */
        generatePackagingRequirements(product, quantity) {
            return [
                'Protective wrapping',
                'Branded packaging',
                quantity > 10 ? 'Bulk packaging' : 'Individual packaging',
            ];
        }
        /**
         * Génère les exigences d'étiquetage
         */
        generateLabelingRequirements(orderId, product, design) {
            return [
                'Order ID',
                'Product SKU',
                'Design reference',
                'Brand information',
            ];
        }
        /**
         * Crée le document d'instructions
         */
        async createInstructionsDocument(instructions) {
            // Simulation de création de document
            // En production, utiliser une librairie comme PDFKit
            const document = JSON.stringify(instructions, null, 2);
            return Buffer.from(document);
        }
        /**
         * Upload les instructions
         */
        async uploadInstructions(instructionsBuffer, orderId) {
            const filename = `instructions/${orderId}/manufacturing-instructions.json`;
            const uploadResult = await this.storageService.uploadBuffer(instructionsBuffer, filename, {
                contentType: 'application/json',
                metadata: {
                    orderId,
                    type: 'manufacturing-instructions',
                },
            });
            return uploadResult;
        }
        /**
         * Sauvegarde la référence des instructions
         */
        async saveInstructionsReference(orderId, instructionsUrl) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    // @ts-ignore - metadata exists in schema but Prisma client may need regeneration
                    metadata: {
                        manufacturingInstructionsUrl: instructionsUrl,
                    },
                },
            });
        }
    };
    __setFunctionName(_classThis, "ProductionWorker");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createProductionBundle_decorators = [(0, bull_1.Process)('create-production-bundle')];
        _qualityControl_decorators = [(0, bull_1.Process)('quality-control')];
        _trackProduction_decorators = [(0, bull_1.Process)('track-production')];
        _generateManufacturingInstructions_decorators = [(0, bull_1.Process)('generate-manufacturing-instructions')];
        __esDecorate(_classThis, null, _createProductionBundle_decorators, { kind: "method", name: "createProductionBundle", static: false, private: false, access: { has: obj => "createProductionBundle" in obj, get: obj => obj.createProductionBundle }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _qualityControl_decorators, { kind: "method", name: "qualityControl", static: false, private: false, access: { has: obj => "qualityControl" in obj, get: obj => obj.qualityControl }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _trackProduction_decorators, { kind: "method", name: "trackProduction", static: false, private: false, access: { has: obj => "trackProduction" in obj, get: obj => obj.trackProduction }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateManufacturingInstructions_decorators, { kind: "method", name: "generateManufacturingInstructions", static: false, private: false, access: { has: obj => "generateManufacturingInstructions" in obj, get: obj => obj.generateManufacturingInstructions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ProductionWorker = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ProductionWorker = _classThis;
})();
exports.ProductionWorker = ProductionWorker;
