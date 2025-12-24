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
exports.DesignWorker = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
let DesignWorker = (() => {
    let _classDecorators = [(0, bull_1.Processor)('design-generation')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _generateDesign_decorators;
    let _validateDesign_decorators;
    let _optimizeDesign_decorators;
    var DesignWorker = _classThis = class {
        constructor(prisma, cache, storageService, productRulesService, validationEngine, outboxService, aiOrchestrator, promptTemplates) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.cache = cache;
            this.storageService = storageService;
            this.productRulesService = productRulesService;
            this.validationEngine = validationEngine;
            this.outboxService = outboxService;
            this.aiOrchestrator = aiOrchestrator;
            this.promptTemplates = promptTemplates;
            this.logger = new common_1.Logger(DesignWorker.name);
        }
        async generateDesign(job) {
            const { designId, productId, brandId, userId, prompt, options, rules, priority } = job.data;
            const startTime = Date.now();
            // Timeout: 30 secondes pour génération design
            const timeout = setTimeout(() => {
                this.logger.error(`Design generation timeout for ${designId} after 30s`);
                job.moveToFailed(new Error('Design generation timeout after 30s'), true);
            }, 30000);
            try {
                this.logger.log(`Starting design generation for design ${designId}`);
                // Mettre à jour le statut
                await this.updateDesignStatus(designId, 'PROCESSING');
                // Valider les règles du produit
                const validationResult = await this.validateDesignRules(productId, options, rules);
                if (!validationResult.isValid) {
                    throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
                }
                // Modérer le prompt (via orchestrator)
                const moderationResult = await this.aiOrchestrator.moderatePrompt(prompt);
                if (!moderationResult.isApproved) {
                    throw new Error(`Prompt moderation failed: ${moderationResult.reason}`);
                }
                // Générer avec l'IA (via orchestrator)
                const aiResult = await this.generateWithAI(prompt, options, rules, brandId, productId);
                // Post-traiter les images générées
                const processedImages = await this.postProcessImages(aiResult.images, options);
                // Uploader les assets
                const uploadedAssets = await this.uploadAssets(processedImages, designId);
                // Créer les enregistrements d'assets
                await this.createAssetRecords(designId, uploadedAssets);
                // Mettre à jour le design avec les résultats
                await this.updateDesignWithResults(designId, {
                    status: 'COMPLETED',
                    optionsJson: options,
                    metadata: {
                        generationTime: Date.now() - startTime,
                        aiMetadata: aiResult.metadata,
                        costs: aiResult.costs,
                        validationResult,
                        moderationResult,
                    },
                });
                // Déclencher les webhooks de succès
                await this.triggerSuccessWebhooks(designId, brandId, uploadedAssets);
                // Mettre en cache les résultats
                await this.cacheDesignResults(designId, uploadedAssets);
                const totalTime = Date.now() - startTime;
                this.logger.log(`Design generation completed for ${designId} in ${totalTime}ms`);
                clearTimeout(timeout);
                // Publier événement via Outbox (transaction-safe)
                await this.outboxService.publish('design.completed', {
                    designId,
                    brandId,
                    userId,
                    productId,
                    assets: uploadedAssets,
                    generationTime: totalTime,
                    completedAt: new Date(),
                });
                return {
                    designId,
                    status: 'success',
                    assets: uploadedAssets,
                    generationTime: totalTime,
                };
            }
            catch (error) {
                clearTimeout(timeout);
                this.logger.error(`Design generation failed for ${designId}:`, error);
                // Mettre à jour le statut d'erreur
                await this.updateDesignStatus(designId, 'FAILED', error.message);
                // Publier événement d'erreur via Outbox
                await this.outboxService.publish('design.failed', {
                    designId,
                    brandId,
                    userId,
                    productId,
                    error: error.message,
                    failedAt: new Date(),
                });
                throw error;
            }
        }
        async validateDesign(job) {
            const { designId, productId, options, rules } = job.data;
            try {
                this.logger.log(`Validating design ${designId}`);
                // Valider avec le moteur de règles
                const validationContext = {
                    productId,
                    brandId: job.data.brandId,
                    userId: job.data.userId,
                    options,
                    rules,
                };
                const validationResult = await this.validationEngine.validateDesign(validationContext);
                // Mettre à jour le design avec les résultats de validation
                await this.prisma.design.update({
                    where: { id: designId },
                    data: {
                        metadata: {
                            validation: validationResult,
                            validatedAt: new Date(),
                        },
                    },
                });
                return {
                    designId,
                    validationResult,
                };
            }
            catch (error) {
                this.logger.error(`Design validation failed for ${designId}:`, error);
                throw error;
            }
        }
        async optimizeDesign(job) {
            const { designId, productId, options } = job.data;
            try {
                this.logger.log(`Optimizing design ${designId}`);
                // Analyser les performances du design
                const performanceAnalysis = await this.analyzeDesignPerformance(designId, options);
                // Optimiser les options selon les règles
                const optimizedOptions = await this.optimizeDesignOptions(options, performanceAnalysis);
                // Générer des suggestions d'amélioration
                const suggestions = await this.generateOptimizationSuggestions(designId, options, optimizedOptions);
                // Mettre à jour le design avec les optimisations
                await this.prisma.design.update({
                    where: { id: designId },
                    data: {
                        options: optimizedOptions,
                        metadata: {
                            optimization: {
                                suggestions,
                                performanceAnalysis,
                                optimizedAt: new Date(),
                            },
                        },
                    },
                });
                return {
                    designId,
                    optimizedOptions,
                    suggestions,
                    performanceAnalysis,
                };
            }
            catch (error) {
                this.logger.error(`Design optimization failed for ${designId}:`, error);
                throw error;
            }
        }
        /**
         * Valide les règles du design
         */
        async validateDesignRules(productId, options, rules) {
            const validationContext = {
                productId,
                brandId: '', // Sera rempli par le job
                options,
                rules,
            };
            return this.validationEngine.validateDesign(validationContext);
        }
        /**
         * Modère le prompt avec l'IA
         */
        async moderatePrompt(prompt) {
            try {
                // Simulation de modération IA
                // En production, utiliser OpenAI Moderation API ou équivalent
                const moderationResult = await this.callModerationAPI(prompt);
                return {
                    isApproved: moderationResult.flagged === false,
                    reason: moderationResult.flagged ? moderationResult.categories?.join(', ') : undefined,
                    confidence: moderationResult.confidence || 0.95,
                    categories: moderationResult.categories,
                };
            }
            catch (error) {
                this.logger.warn(`Moderation API failed, allowing prompt: ${error.message}`);
                return {
                    isApproved: true,
                    confidence: 0.5,
                };
            }
        }
        /**
         * Génère avec l'IA (utilise AIOrchestrator)
         */
        async generateWithAI(prompt, options, rules, brandId, productId) {
            const startTime = Date.now();
            try {
                // 1. Récupérer le template si occasion/style spécifiés
                let finalPrompt = prompt;
                if (options.occasion || options.style) {
                    const template = await this.promptTemplates.getTemplate(options.occasion, options.style);
                    if (template) {
                        // Récupérer les infos du produit pour le contexte
                        let product = null;
                        if (productId) {
                            product = await this.prisma.product.findUnique({
                                where: { id: productId },
                                select: { name: true, description: true },
                            });
                        }
                        const context = {
                            userInput: prompt,
                            productName: product?.name,
                            productDescription: product?.description,
                            occasion: options.occasion,
                            style: options.style,
                            brandKit: options.brandKit,
                            constraints: options.constraints,
                        };
                        finalPrompt = this.promptTemplates.renderTemplate(template, context);
                        this.logger.debug(`Used prompt template: ${template.name} v${template.version}`);
                    }
                }
                // 2. Modérer le prompt (déjà fait dans generateDesign, mais on peut re-vérifier)
                const moderation = await this.aiOrchestrator.moderatePrompt(finalPrompt);
                if (!moderation.isApproved) {
                    throw new Error(`Prompt rejected: ${moderation.reason}`);
                }
                // 3. Déterminer la stratégie de routing
                const strategy = {
                    stage: (options.previewMode ? 'preview' : options.exploration ? 'exploration' : 'final'),
                    quality: (options.quality || 'standard'),
                    preferredProvider: options.provider,
                };
                // 4. Générer avec l'orchestrateur (routing intelligent)
                const result = await this.aiOrchestrator.generateImage({
                    prompt: finalPrompt,
                    size: options.size || '1024x1024',
                    quality: options.quality || 'standard',
                    style: options.style || 'natural',
                    n: options.numImages || 1,
                }, strategy, brandId);
                const generationTime = Date.now() - startTime;
                return {
                    images: result.images,
                    metadata: {
                        ...result.metadata,
                        generationTime,
                        quality: result.metadata.quality || options.quality || 'standard',
                        originalPrompt: prompt,
                        finalPrompt,
                        moderation,
                    },
                    costs: {
                        tokens: result.costs.tokens,
                        credits: result.costs.credits,
                        cost: result.costs.costCents ? result.costs.costCents / 100 : 0,
                    },
                };
            }
            catch (error) {
                this.logger.error(`AI generation failed:`, error);
                throw error;
            }
        }
        /**
         * Sélectionne le modèle IA approprié
         */
        selectAIModel(options, rules) {
            // Logique de sélection du modèle selon les besoins
            if (options.quality === 'ultra') {
                return 'dall-e-3';
            }
            else if (options.quality === 'high') {
                return 'midjourney-v6';
            }
            else if (rules.zones?.some((zone) => zone.type === '3d')) {
                return 'stable-diffusion-3d';
            }
            else {
                return 'stable-diffusion-xl';
            }
        }
        /**
         * Prépare les paramètres de génération
         */
        prepareGenerationParams(prompt, options, model) {
            const baseParams = {
                prompt,
                num_images: options.numImages || 1,
                size: options.size || '1024x1024',
                quality: options.quality || 'standard',
            };
            // Paramètres spécifiques au modèle
            switch (model) {
                case 'dall-e-3':
                    return {
                        ...baseParams,
                        style: options.style || 'natural',
                        quality: options.quality || 'standard',
                    };
                case 'stable-diffusion-xl':
                    return {
                        ...baseParams,
                        steps: options.steps || 30,
                        cfg_scale: options.cfgScale || 7.5,
                        seed: options.seed,
                    };
                default:
                    return baseParams;
            }
        }
        /**
         * Appelle l'API IA
         */
        async callAIAPI(model, params) {
            // Simulation d'appel API
            // En production, utiliser les vraies APIs (OpenAI, Stability AI, etc.)
            const mockResponse = {
                images: [
                    {
                        url: `https://generated-image-${Date.now()}.png`,
                        width: 1024,
                        height: 1024,
                        format: 'png',
                    },
                ],
                usage: {
                    total_tokens: 150,
                    credits: 10,
                },
                seed: Math.floor(Math.random() * 1000000),
                version: '1.0',
            };
            // Simuler un délai de génération
            await new Promise(resolve => setTimeout(resolve, 2000));
            return mockResponse;
        }
        /**
         * Appelle l'API de modération
         */
        async callModerationAPI(prompt) {
            // Simulation de modération
            // En production, utiliser OpenAI Moderation API
            const flagged = prompt.toLowerCase().includes('inappropriate');
            return {
                flagged,
                confidence: 0.95,
                categories: flagged ? ['inappropriate'] : [],
            };
        }
        /**
         * Traite la réponse IA
         */
        async processAIResponse(response) {
            const images = [];
            for (const imageData of response.images) {
                // Télécharger l'image pour obtenir la taille
                const imageBuffer = await this.downloadImage(imageData.url);
                images.push({
                    url: imageData.url,
                    width: imageData.width,
                    height: imageData.height,
                    format: imageData.format,
                    size: imageBuffer.length,
                });
            }
            return images;
        }
        /**
         * Post-traite les images générées
         */
        async postProcessImages(images, options) {
            const processedImages = [];
            for (const image of images) {
                try {
                    // Appliquer les post-traitements selon les options
                    const processedImage = await this.applyPostProcessing(image, options);
                    processedImages.push(processedImage);
                }
                catch (error) {
                    this.logger.warn(`Post-processing failed for image ${image.url}:`, error);
                    processedImages.push(image); // Garder l'image originale
                }
            }
            return processedImages;
        }
        /**
         * Applique les post-traitements
         */
        async applyPostProcessing(image, options) {
            // Simulation de post-traitement
            // En production, utiliser Sharp ou équivalent
            return {
                ...image,
                processed: true,
                effects: options.effects || [],
            };
        }
        /**
         * Upload les assets vers S3
         */
        async uploadAssets(images, designId) {
            const uploadedAssets = [];
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                try {
                    // Télécharger l'image depuis l'URL générée
                    const imageBuffer = await this.downloadImage(image.url);
                    // Uploader vers S3
                    const filename = `designs/${designId}/image_${i + 1}.${image.format}`;
                    const uploadResult = await this.storageService.uploadBuffer(imageBuffer, filename, {
                        contentType: `image/${image.format}`,
                        metadata: {
                            designId,
                            imageIndex: (i + 1).toString(),
                            generatedAt: new Date().toISOString(),
                        },
                    });
                    uploadedAssets.push({
                        url: uploadResult,
                        filename,
                        size: imageBuffer.length,
                        format: image.format,
                        width: image.width,
                        height: image.height,
                        index: i + 1,
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to upload image ${i + 1} for design ${designId}:`, error);
                    throw error;
                }
            }
            return uploadedAssets;
        }
        /**
         * Télécharge une image
         */
        async downloadImage(url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }
            return Buffer.from(await response.arrayBuffer());
        }
        /**
         * Crée les enregistrements d'assets
         */
        async createAssetRecords(designId, assets) {
            for (const asset of assets) {
                // @ts-ignore - asset exists in schema but Prisma client may need regeneration
                await this.prisma.asset.create({
                    data: {
                        designId: designId,
                        url: asset.url,
                        type: asset.format,
                        metadata: {
                            filename: asset.filename,
                            size: asset.size,
                            width: asset.width,
                            height: asset.height,
                            index: asset.index,
                        },
                    },
                });
            }
        }
        /**
         * Met à jour le design avec les résultats
         */
        async updateDesignWithResults(designId, data) {
            await this.prisma.design.update({
                where: { id: designId },
                data,
            });
        }
        /**
         * Met à jour le statut du design
         */
        async updateDesignStatus(designId, status, error) {
            await this.prisma.design.update({
                where: { id: designId },
                data: {
                    status: status,
                    ...(error && { metadata: { error, failedAt: new Date() } }),
                },
            });
        }
        /**
         * Calcule le coût
         */
        calculateCost(usage) {
            // Logique de calcul des coûts
            return (usage?.total_tokens || 0) * 0.0001 + (usage?.credits || 0) * 0.01;
        }
        /**
         * Analyse les performances du design
         */
        async analyzeDesignPerformance(designId, options) {
            // Simulation d'analyse de performance
            return {
                complexity: this.calculateComplexity(options),
                estimatedRenderTime: this.estimateRenderTime(options),
                resourceUsage: this.estimateResourceUsage(options),
                qualityScore: this.calculateQualityScore(options),
            };
        }
        /**
         * Calcule la complexité
         */
        calculateComplexity(options) {
            let complexity = 1;
            if (options.zones) {
                complexity += Object.keys(options.zones).length * 0.5;
            }
            if (options.effects) {
                complexity += options.effects.length * 0.3;
            }
            return Math.min(complexity, 10);
        }
        /**
         * Estime le temps de rendu
         */
        estimateRenderTime(options) {
            const baseTime = 2000; // 2 secondes de base
            const complexity = this.calculateComplexity(options);
            return baseTime * complexity;
        }
        /**
         * Estime l'utilisation des ressources
         */
        estimateResourceUsage(options) {
            return {
                memory: this.calculateComplexity(options) * 100, // MB
                cpu: this.calculateComplexity(options) * 10, // %
                gpu: options.quality === 'ultra' ? 80 : 40, // %
            };
        }
        /**
         * Calcule le score de qualité
         */
        calculateQualityScore(options) {
            let score = 0.5;
            if (options.quality === 'ultra')
                score += 0.3;
            else if (options.quality === 'high')
                score += 0.2;
            else if (options.quality === 'standard')
                score += 0.1;
            if (options.effects && options.effects.length > 0)
                score += 0.1;
            return Math.min(score, 1.0);
        }
        /**
         * Optimise les options du design
         */
        async optimizeDesignOptions(options, performanceAnalysis) {
            const optimized = { ...options };
            // Optimisations basées sur l'analyse de performance
            if (performanceAnalysis.complexity > 8) {
                // Réduire la complexité
                if (optimized.effects && optimized.effects.length > 3) {
                    optimized.effects = optimized.effects.slice(0, 3);
                }
            }
            if (performanceAnalysis.estimatedRenderTime > 10000) {
                // Réduire la qualité si nécessaire
                if (optimized.quality === 'ultra') {
                    optimized.quality = 'high';
                }
            }
            return optimized;
        }
        /**
         * Génère des suggestions d'optimisation
         */
        async generateOptimizationSuggestions(designId, originalOptions, optimizedOptions) {
            const suggestions = [];
            if (originalOptions.quality !== optimizedOptions.quality) {
                suggestions.push(`Qualité réduite de ${originalOptions.quality} à ${optimizedOptions.quality} pour améliorer les performances`);
            }
            if (originalOptions.effects?.length > optimizedOptions.effects?.length) {
                suggestions.push(`${originalOptions.effects.length - optimizedOptions.effects.length} effet(s) supprimé(s) pour réduire la complexité`);
            }
            return suggestions;
        }
        /**
         * Met en cache les résultats du design
         */
        async cacheDesignResults(designId, assets) {
            const cacheKey = `design_results:${designId}`;
            const cacheData = {
                assets,
                cachedAt: new Date(),
            };
            await this.cache.setSimple(cacheKey, JSON.stringify(cacheData), 3600); // 1 heure
        }
        /**
         * Déclenche les webhooks de succès (déprécié - utiliser OutboxService)
         * @deprecated Use OutboxService.publish('design.completed', ...) instead
         */
        async triggerSuccessWebhooks(designId, brandId, assets) {
            // Migration vers Outbox: les événements sont maintenant publiés via OutboxService
            this.logger.debug(`Success webhooks for design ${designId} (migrated to Outbox)`);
        }
        /**
         * Déclenche les webhooks d'erreur (déprécié - utiliser OutboxService)
         * @deprecated Use OutboxService.publish('design.failed', ...) instead
         */
        async triggerErrorWebhooks(designId, brandId, error) {
            // Migration vers Outbox: les événements sont maintenant publiés via OutboxService
            this.logger.debug(`Error webhooks for design ${designId} (migrated to Outbox)`);
        }
    };
    __setFunctionName(_classThis, "DesignWorker");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _generateDesign_decorators = [(0, bull_1.Process)('generate-design')];
        _validateDesign_decorators = [(0, bull_1.Process)('validate-design')];
        _optimizeDesign_decorators = [(0, bull_1.Process)('optimize-design')];
        __esDecorate(_classThis, null, _generateDesign_decorators, { kind: "method", name: "generateDesign", static: false, private: false, access: { has: obj => "generateDesign" in obj, get: obj => obj.generateDesign }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validateDesign_decorators, { kind: "method", name: "validateDesign", static: false, private: false, access: { has: obj => "validateDesign" in obj, get: obj => obj.validateDesign }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _optimizeDesign_decorators, { kind: "method", name: "optimizeDesign", static: false, private: false, access: { has: obj => "optimizeDesign" in obj, get: obj => obj.optimizeDesign }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DesignWorker = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DesignWorker = _classThis;
})();
exports.DesignWorker = DesignWorker;
