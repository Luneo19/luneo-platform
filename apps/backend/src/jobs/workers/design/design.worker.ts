import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { Prisma, DesignStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { S3Service } from '@/libs/s3/s3.service';
import { ProductRulesService } from '@/modules/product-engine/services/product-rules.service';
import { ValidationEngine } from '@/modules/product-engine/services/validation-engine.service';
import {
  DesignOptions,
  DesignZoneOption,
  ProductRules,
  ValidationResult,
  ZoneValidationContext,
} from '@/modules/product-engine/interfaces/product-rules.interface';
import { getErrorMessage, getErrorStack } from '@/common/utils/error.utils';

type RawDesignZone = {
  id?: string;
  type?: string;
} & Record<string, unknown>;

type RawDesignOptions = Omit<DesignOptions, 'zones'> & {
  quality?: 'standard' | 'high' | 'ultra';
  numImages?: number;
  size?: string;
  style?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  effects?: string[];
  zones?: RawDesignZone[];
};

interface DesignJobData {
  designId: string;
  productId: string;
  brandId: string;
  userId?: string;
  prompt: string;
  options: RawDesignOptions;
  rules: ProductRules;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  retryCount?: number;
}

interface AIGenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    format: string;
    size: number;
  }>;
  metadata: {
    model: string;
    version: string;
    generationTime: number;
    quality: string;
    prompt: string;
    seed?: number;
  };
  costs: {
    tokens: number;
    credits: number;
    cost: number;
  };
}

@Processor(QueueNames.DESIGN_GENERATION)
export class DesignWorker extends WorkerHost {
  private readonly logger = new Logger(DesignWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly s3Service: S3Service,
    private readonly productRulesService: ProductRulesService,
    private readonly validationEngine: ValidationEngine,
  ) {
    super();
  }

  async process(job: Job<DesignJobData>): Promise<unknown> {
    switch (job.name) {
      case 'validate-design':
        return this.validateDesign(job);
      case 'optimize-design':
        return this.optimizeDesign(job);
      default:
        return this.generateDesign(job);
    }
  }

  private async generateDesign(job: Job<DesignJobData>) {
    const { designId, productId, brandId, userId, prompt, options, rules, priority } = job.data;
    const startTime = Date.now();
    const normalizedOptions = this.normalizeDesignOptions(options);

    try {
      this.logger.log(`Starting design generation for design ${designId}`);

      // Mettre à jour le statut
      await this.updateDesignStatus(designId, DesignStatus.PROCESSING);

      // Valider les règles du produit
      const validationResult = await this.validateDesignRules({
        productId,
        brandId,
        userId,
        options: normalizedOptions,
        rules,
      });
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Modérer le prompt
      const moderationResult = await this.moderatePrompt(prompt);
      if (!moderationResult.isApproved) {
        throw new Error(`Prompt moderation failed: ${moderationResult.reason}`);
      }

      // Générer avec l'IA
      const aiResult = await this.generateWithAI(prompt, normalizedOptions, rules);

      // Post-traiter les images générées
      const processedImages = await this.postProcessImages(aiResult.images, normalizedOptions);

      // Uploader les assets
      const uploadedAssets = await this.uploadAssets(processedImages, designId);

      // Créer les enregistrements d'assets
      await this.createAssetRecords(designId, uploadedAssets);

      // Mettre à jour le design avec les résultats
      const generationTime = Date.now() - startTime;
      await this.updateDesignWithResults(designId, {
        status: DesignStatus.COMPLETED,
        optionsJson: this.toJson(normalizedOptions),
        metadata: this.toJsonObject({
          generationTime,
          aiMetadata: aiResult.metadata,
          costs: aiResult.costs,
          validationResult,
          moderationResult,
        }),
      });

      // Déclencher les webhooks de succès
      await this.triggerSuccessWebhooks(designId, brandId, uploadedAssets);

      // Mettre en cache les résultats
      await this.cacheDesignResults(designId, uploadedAssets);

      this.logger.log(`Design generation completed for ${designId} in ${generationTime}ms`);

      return {
        designId,
        status: 'success',
        assets: uploadedAssets,
        generationTime,
      };

    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(
        `Design generation failed for ${designId}: ${message}`,
        getErrorStack(error),
      );

      // Mettre à jour le statut d'erreur
      await this.updateDesignStatus(designId, DesignStatus.FAILED, message);

      // Déclencher les webhooks d'erreur
      await this.triggerErrorWebhooks(designId, brandId, message);

      throw error instanceof Error ? error : new Error(message);
    }
  }

  private async validateDesign(job: Job<DesignJobData>) {
    const { designId, productId, brandId, userId, options, rules } = job.data;
    const normalizedOptions = this.normalizeDesignOptions(options);

    try {
      this.logger.log(`Validating design ${designId}`);

      // Valider avec le moteur de règles
      const validationContext = {
        productId,
        brandId,
        userId,
        options: normalizedOptions,
        rules,
      };

      const validationResult = await this.validateDesignRules(validationContext);

      // Mettre à jour le design avec les résultats de validation
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          metadata: this.toJsonObject({
            validation: this.toJson(validationResult),
            validatedAt: new Date().toISOString(),
          }),
        },
      });

      return {
        designId,
        validationResult,
      };

    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(
        `Design validation failed for ${designId}: ${message}`,
        getErrorStack(error),
      );
      throw error instanceof Error ? error : new Error(message);
    }
  }

  private async optimizeDesign(job: Job<DesignJobData>) {
    const { designId, productId, options } = job.data;
    const normalizedOptions = this.normalizeDesignOptions(options);

    try {
      this.logger.log(`Optimizing design ${designId}`);

      // Analyser les performances du design
      const performanceAnalysis = await this.analyzeDesignPerformance(designId, normalizedOptions);

      // Optimiser les options selon les règles
      const optimizedOptions = await this.optimizeDesignOptions(normalizedOptions, performanceAnalysis);

      // Générer des suggestions d'amélioration
      const suggestions = await this.generateOptimizationSuggestions(designId, normalizedOptions, optimizedOptions);

      // Mettre à jour le design avec les optimisations
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          options: this.toJson(optimizedOptions),
          metadata: this.toJsonObject({
            optimization: {
              suggestions: this.toJson(suggestions),
              performanceAnalysis: this.toJson(performanceAnalysis),
              optimizedAt: new Date().toISOString(),
            },
          }),
        },
      });

      return {
        designId,
        optimizedOptions,
        suggestions,
        performanceAnalysis,
      };

    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(
        `Design optimization failed for ${designId}: ${message}`,
        getErrorStack(error),
      );
      throw error instanceof Error ? error : new Error(message);
    }
  }

  /**
   * Valide les règles du design
   */
  private async validateDesignRules(context: ZoneValidationContext): Promise<ValidationResult> {
    return this.validationEngine.validateDesign(context);
  }

  /**
   * Modère le prompt avec l'IA
   */
  private async moderatePrompt(prompt: string): Promise<{
    isApproved: boolean;
    reason?: string;
    confidence: number;
    categories?: string[];
  }> {
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
    } catch (error) {
      this.logger.warn(`Moderation API failed, allowing prompt: ${error.message}`);
      return {
        isApproved: true,
        confidence: 0.5,
      };
    }
  }

  /**
   * Génère avec l'IA
   */
  private async generateWithAI(prompt: string, options: DesignOptions, rules: ProductRules): Promise<AIGenerationResult> {
    const startTime = Date.now();

    try {
      // Déterminer le modèle à utiliser selon les options
      const model = this.selectAIModel(options, rules);
      
      // Préparer les paramètres de génération
      const generationParams = this.prepareGenerationParams(prompt, options, model);

      // Appeler l'API IA
      const aiResponse = await this.callAIAPI(model, generationParams);

      // Traiter la réponse
      const images = await this.processAIResponse(aiResponse);

      const generationTime = Date.now() - startTime;

      return {
        images,
        metadata: {
          model,
          version: aiResponse.version || '1.0',
          generationTime,
          quality: options.quality || 'standard',
          prompt,
          seed: aiResponse.seed,
        },
        costs: {
          tokens: aiResponse.usage?.total_tokens || 0,
          credits: aiResponse.usage?.credits || 0,
          cost: this.calculateCost(aiResponse.usage),
        },
      };

    } catch (error) {
      this.logger.error(`AI generation failed:`, error);
      throw error;
    }
  }

  /**
   * Sélectionne le modèle IA approprié
   */
  private selectAIModel(options: DesignOptions, _rules: ProductRules): string {
    // Logique de sélection du modèle selon les besoins
    if (options.quality === 'ultra') {
      return 'dall-e-3';
    } else if (options.quality === 'high') {
      return 'midjourney-v6';
    } else if (this.hasZoneType(options, '3d')) {
      return 'stable-diffusion-3d';
    } else {
      return 'stable-diffusion-xl';
    }
  }

  /**
   * Prépare les paramètres de génération
   */
  private prepareGenerationParams(prompt: string, options: DesignOptions, model: string): Record<string, unknown> {
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
  private async callAIAPI(model: string, params: Record<string, unknown>): Promise<{
    images: Array<{ url: string; width: number; height: number; format: string }>;
    usage: { total_tokens: number; credits: number };
    seed: number;
    version: string;
  }> {
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
  private async callModerationAPI(prompt: string): Promise<{
    flagged: boolean;
    confidence: number;
    categories: string[];
  }> {
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
  private async processAIResponse(response: {
    images: Array<{ url: string; width: number; height: number; format: string }>;
  }): Promise<Array<{
    url: string;
    width: number;
    height: number;
    format: string;
    size: number;
  }>> {
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
  private async postProcessImages(
    images: Array<{ url: string; width: number; height: number; format: string; size: number }>,
    options: DesignOptions
  ): Promise<Array<{ url: string; width: number; height: number; format: string; size: number; processed?: boolean; effects?: string[] }>> {
    const processedImages = [];

    for (const image of images) {
      try {
        // Appliquer les post-traitements selon les options
        const processedImage = await this.applyPostProcessing(image, options);
        processedImages.push(processedImage);
      } catch (error) {
        this.logger.warn(`Post-processing failed for image ${image.url}:`, error);
        processedImages.push(image); // Garder l'image originale
      }
    }

    return processedImages;
  }

  /**
   * Applique les post-traitements
   */
  private async applyPostProcessing(
    image: { url: string; width: number; height: number; format: string; size: number },
    options: DesignOptions
  ): Promise<{ url: string; width: number; height: number; format: string; size: number; processed: boolean; effects: string[] }> {
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
  private async uploadAssets(
    images: Array<{ url: string; width: number; height: number; format: string; size: number }>,
    designId: string
  ): Promise<Array<{ url: string | { Location: string }; filename: string; size: number; format: string; width: number; height: number; index: number }>> {
    const uploadedAssets = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Télécharger l'image depuis l'URL générée
        const imageBuffer = await this.downloadImage(image.url);
        
        // Uploader vers S3
        const filename = `designs/${designId}/image_${i + 1}.${image.format}`;
        const uploadResult = await this.s3Service.uploadBuffer(
          imageBuffer,
          filename,
          {
            contentType: `image/${image.format}`,
            metadata: {
              designId,
              imageIndex: (i + 1).toString(),
              generatedAt: new Date().toISOString(),
            },
          }
        );

        uploadedAssets.push({
          url: uploadResult,
          filename,
          size: imageBuffer.length,
          format: image.format,
          width: image.width,
          height: image.height,
          index: i + 1,
        });

      } catch (error) {
        this.logger.error(`Failed to upload image ${i + 1} for design ${designId}:`, error);
        throw error;
      }
    }

    return uploadedAssets;
  }

  /**
   * Télécharge une image
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Crée les enregistrements d'assets
   */
  private async createAssetRecords(
    designId: string,
    assets: Array<{ url: string | { Location: string }; filename: string; size: number; format: string; width: number; height: number; index: number }>
  ): Promise<void> {
    for (const asset of assets) {
      const assetUrl = typeof asset.url === 'string' ? asset.url : asset.url.Location;
      const assetType = ['glb', 'gltf', 'usdz'].includes(asset.format.toLowerCase()) ? 'model' : 'image';

      await this.prisma.asset.create({
        data: {
          designId,
          url: assetUrl,
          type: assetType,
          format: asset.format,
          size: asset.size,
          width: asset.width,
          height: asset.height,
          metadata: this.toJsonObject({
            filename: asset.filename,
            originalUrl: assetUrl,
            width: asset.width,
            height: asset.height,
            index: asset.index,
          }),
        },
      });
    }
  }

  /**
   * Met à jour le design avec les résultats
   */
  private async updateDesignWithResults(
    designId: string,
    data: {
      status: DesignStatus;
      optionsJson: Prisma.InputJsonValue;
      metadata: Prisma.JsonObject;
    },
  ): Promise<void> {
    const updateData: Prisma.DesignUpdateInput = {
      status: data.status,
      optionsJson: data.optionsJson,
      metadata: data.metadata,
    };

    await this.prisma.design.update({
      where: { id: designId },
      data: updateData,
    });
  }

  /**
   * Met à jour le statut du design
   */
  private async updateDesignStatus(designId: string, status: DesignStatus, error?: string): Promise<void> {
    const data: Prisma.DesignUpdateInput = { status };

    if (error) {
      data.metadata = this.toJsonObject({
        error,
        failedAt: new Date().toISOString(),
      });
    }

    await this.prisma.design.update({
      where: { id: designId },
      data,
    });
  }

  /**
   * Calcule le coût
   */
  private calculateCost(usage: { total_tokens?: number; credits?: number }): number {
    // Logique de calcul des coûts
    return (usage?.total_tokens || 0) * 0.0001 + (usage?.credits || 0) * 0.01;
  }

  /**
   * Analyse les performances du design
   */
  private async analyzeDesignPerformance(designId: string, options: DesignOptions): Promise<{
    complexity: number;
    estimatedRenderTime: number;
    resourceUsage: { memory: number; cpu: number; gpu: number };
    qualityScore: number;
  }> {
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
  private calculateComplexity(options: DesignOptions): number {
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
  private estimateRenderTime(options: DesignOptions): number {
    const baseTime = 2000; // 2 secondes de base
    const complexity = this.calculateComplexity(options);
    return baseTime * complexity;
  }

  /**
   * Estime l'utilisation des ressources
   */
  private estimateResourceUsage(options: DesignOptions): { memory: number; cpu: number; gpu: number } {
    return {
      memory: this.calculateComplexity(options) * 100, // MB
      cpu: this.calculateComplexity(options) * 10, // %
      gpu: options.quality === 'ultra' ? 80 : 40, // %
    };
  }

  /**
   * Calcule le score de qualité
   */
  private calculateQualityScore(options: DesignOptions): number {
    let score = 0.5;
    
    if (options.quality === 'ultra') score += 0.3;
    else if (options.quality === 'high') score += 0.2;
    else if (options.quality === 'standard') score += 0.1;
    
    if (options.effects && options.effects.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Optimise les options du design
   */
  private async optimizeDesignOptions(
    options: DesignOptions,
    performanceAnalysis: { complexity: number; estimatedRenderTime: number; resourceUsage: { memory: number; cpu: number; gpu: number }; qualityScore: number }
  ): Promise<DesignOptions> {
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
  private async generateOptimizationSuggestions(designId: string, originalOptions: DesignOptions, optimizedOptions: DesignOptions): Promise<string[]> {
    const suggestions: string[] = [];
    const originalEffects = originalOptions.effects ?? [];
    const optimizedEffects = optimizedOptions.effects ?? [];

    if (originalOptions.quality && optimizedOptions.quality && originalOptions.quality !== optimizedOptions.quality) {
      suggestions.push(`Qualité réduite de ${originalOptions.quality} à ${optimizedOptions.quality} pour améliorer les performances`);
    }
    
    if (originalEffects.length > optimizedEffects.length) {
      suggestions.push(`${originalEffects.length - optimizedEffects.length} effet(s) supprimé(s) pour réduire la complexité`);
    }
    
    return suggestions;
  }

  /**
   * Normalise les options de design brutes pour garantir la compatibilité avec Prisma et les moteurs de validation.
   */
  private normalizeDesignOptions(options: RawDesignOptions): DesignOptions {
    const { zones, effects, ...rest } = options;
    const normalized = { ...(rest as Record<string, unknown>) } as DesignOptions;

    const normalizedEffects = this.ensureStringArray(effects);
    normalized.effects = normalizedEffects;

    const { record, types } = this.normalizeZones(zones);
    if (record) {
      normalized.zones = record;
    }
    if (types.length > 0) {
      normalized.zoneTypes = types;
    }

    return normalized;
  }

  private normalizeZones(zones?: RawDesignZone[]): { record?: Record<string, DesignZoneOption>; types: string[] } {
    if (!zones || zones.length === 0) {
      return { record: undefined, types: [] };
    }

    const record: Record<string, DesignZoneOption> = {};
    const types: string[] = [];

    zones.forEach((zone, index) => {
      const zoneId = typeof zone.id === 'string' ? zone.id : `zone_${index}`;
      const zoneType = typeof zone.type === 'string' ? zone.type.toLowerCase() : undefined;
      const normalizedZone = this.normalizeZone(zone);
      record[zoneId] = normalizedZone;
      if (zoneType) {
        types.push(zoneType);
      }
    });

    return {
      record: Object.keys(record).length > 0 ? record : undefined,
      types,
    };
  }

  private normalizeZone(zone: RawDesignZone): DesignZoneOption {
    const zoneType = typeof zone.type === 'string' ? zone.type.toLowerCase() : undefined;

    switch (zoneType) {
      case 'text':
        return {
          text: this.getString(zone, 'text'),
          font: this.getString(zone, 'font'),
          effects: this.getStringArray(zone, 'effects'),
        };

      case 'color':
        return {
          color: this.getString(zone, 'color'),
          gradient: this.getBoolean(zone, 'gradient'),
        };

      case 'select':
        return {
          value: this.getString(zone, 'value'),
        };

      case 'image':
      case '3d':
      default:
        return {
          imageUrl: this.getString(zone, 'imageUrl') ?? this.getString(zone, 'url'),
          imageFile: zone.imageFile,
          mimeType: this.getString(zone, 'mimeType'),
          width: this.getNumber(zone, 'width'),
          height: this.getNumber(zone, 'height'),
          hasTransparency: this.getBoolean(zone, 'hasTransparency'),
          quality: this.getNumber(zone, 'quality'),
          effects: this.getStringArray(zone, 'effects'),
        };
    }
  }

  private getString(source: Record<string, unknown>, key: string): string | undefined {
    const value = source[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private getNumber(source: Record<string, unknown>, key: string): number | undefined {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private getBoolean(source: Record<string, unknown>, key: string): boolean | undefined {
    const value = source[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return undefined;
  }

  private getStringArray(source: Record<string, unknown>, key: string): string[] | undefined {
    const value = source[key];
    if (!Array.isArray(value)) {
      return undefined;
    }
    const result = value.filter((item): item is string => typeof item === 'string');
    return result.length > 0 ? result : undefined;
  }

  private ensureStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }

  private hasZoneType(options: DesignOptions, type: string): boolean {
    return Array.isArray(options.zoneTypes) && options.zoneTypes.includes(type);
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private toJsonObject(value: Record<string, unknown>): Prisma.JsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.JsonObject;
  }

  /**
   * Met en cache les résultats du design
   */
  private async cacheDesignResults(
    designId: string,
    assets: Array<{ url: string | { Location: string }; filename: string; size: number; format: string; width: number; height: number; index: number }>
  ): Promise<void> {
    const cacheKey = `design_results:${designId}`;
    const cacheData = {
      assets,
      cachedAt: new Date(),
    };
    
    await this.cache.setSimple(cacheKey, JSON.stringify(cacheData), 3600); // 1 heure
  }

  /**
   * Déclenche les webhooks de succès
   */
  private async triggerSuccessWebhooks(
    designId: string,
    brandId: string,
    assets: Array<{ url: string | { Location: string }; filename: string; size: number; format: string; width: number; height: number; index: number }>
  ): Promise<void> {
    // Implémentation des webhooks de succès
    this.logger.log(`Triggering success webhooks for design ${designId}`);
  }

  /**
   * Déclenche les webhooks d'erreur
   */
  private async triggerErrorWebhooks(designId: string, brandId: string, error: string): Promise<void> {
    // Implémentation des webhooks d'erreur
    this.logger.log(`Triggering error webhooks for design ${designId}: ${error}`);
  }
}


