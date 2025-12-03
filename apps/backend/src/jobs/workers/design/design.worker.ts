import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { StorageService } from '@/libs/storage/storage.service';
import { ProductRulesService } from '@/modules/product-engine/services/product-rules.service';
import { ValidationEngine } from '@/modules/product-engine/services/validation-engine.service';

interface DesignJobData {
  designId: string;
  productId: string;
  brandId: string;
  userId?: string;
  prompt: string;
  options: any;
  rules: any;
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

@Processor('design-generation')
export class DesignWorker {
  private readonly logger = new Logger(DesignWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly storageService: StorageService,
    private readonly productRulesService: ProductRulesService,
    private readonly validationEngine: ValidationEngine,
  ) {}

  @Process('generate-design')
  async generateDesign(job: Job<DesignJobData>) {
    const { designId, productId, brandId, userId, prompt, options, rules, priority } = job.data;
    const startTime = Date.now();

    try {
      this.logger.log(`Starting design generation for design ${designId}`);

      // Mettre à jour le statut
      await this.updateDesignStatus(designId, 'PROCESSING');

      // Valider les règles du produit
      const validationResult = await this.validateDesignRules(productId, options, rules);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Modérer le prompt
      const moderationResult = await this.moderatePrompt(prompt);
      if (!moderationResult.isApproved) {
        throw new Error(`Prompt moderation failed: ${moderationResult.reason}`);
      }

      // Générer avec l'IA
      const aiResult = await this.generateWithAI(prompt, options, rules);

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

      return {
        designId,
        status: 'success',
        assets: uploadedAssets,
        generationTime: totalTime,
      };

    } catch (error) {
      this.logger.error(`Design generation failed for ${designId}:`, error);

      // Mettre à jour le statut d'erreur
      await this.updateDesignStatus(designId, 'FAILED', error.message);

      // Déclencher les webhooks d'erreur
      await this.triggerErrorWebhooks(designId, brandId, error.message);

      throw error;
    }
  }

  @Process('validate-design')
  async validateDesign(job: Job<DesignJobData>) {
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
            validation: validationResult as any,
            validatedAt: new Date(),
          } as any,
        },
      });

      return {
        designId,
        validationResult,
      };

    } catch (error) {
      this.logger.error(`Design validation failed for ${designId}:`, error);
      throw error;
    }
  }

  @Process('optimize-design')
  async optimizeDesign(job: Job<DesignJobData>) {
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
          options: optimizedOptions as any,
          metadata: {
            optimization: {
              suggestions,
              performanceAnalysis,
              optimizedAt: new Date(),
            },
          } as any,
        },
      });

      return {
        designId,
        optimizedOptions,
        suggestions,
        performanceAnalysis,
      };

    } catch (error) {
      this.logger.error(`Design optimization failed for ${designId}:`, error);
      throw error;
    }
  }

  /**
   * Valide les règles du design
   */
  private async validateDesignRules(productId: string, options: any, rules: any) {
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
  private async generateWithAI(prompt: string, options: any, rules: any): Promise<AIGenerationResult> {
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
  private selectAIModel(options: any, rules: any): string {
    // Logique de sélection du modèle selon les besoins
    if (options.quality === 'ultra') {
      return 'dall-e-3';
    } else if (options.quality === 'high') {
      return 'midjourney-v6';
    } else if (rules.zones?.some((zone: any) => zone.type === '3d')) {
      return 'stable-diffusion-3d';
    } else {
      return 'stable-diffusion-xl';
    }
  }

  /**
   * Prépare les paramètres de génération
   */
  private prepareGenerationParams(prompt: string, options: any, model: string): any {
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
  private async callAIAPI(model: string, params: any): Promise<any> {
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
  private async callModerationAPI(prompt: string): Promise<any> {
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
  private async processAIResponse(response: any): Promise<Array<{
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
  private async postProcessImages(images: any[], options: any): Promise<any[]> {
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
  private async applyPostProcessing(image: any, options: any): Promise<any> {
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
  private async uploadAssets(images: any[], designId: string): Promise<any[]> {
    const uploadedAssets = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // Télécharger l'image depuis l'URL générée
        const imageBuffer = await this.downloadImage(image.url);
        
        // Uploader vers S3
        const filename = `designs/${designId}/image_${i + 1}.${image.format}`;
        const uploadResult = await this.storageService.uploadBuffer(
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
          url: uploadResult as any,
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
  private async createAssetRecords(designId: string, assets: any[]): Promise<void> {
    for (const asset of assets) {
      // @ts-ignore - asset exists in schema but Prisma client may need regeneration
      await (this.prisma as any).asset.create({
        data: {
          designId: designId as any,
          url: asset.url,
          type: asset.format,
          metadata: {
            filename: asset.filename,
            size: asset.size,
            width: asset.width,
            height: asset.height,
            index: asset.index,
          } as any,
        } as any,
      });
    }
  }

  /**
   * Met à jour le design avec les résultats
   */
  private async updateDesignWithResults(designId: string, data: any): Promise<void> {
    await this.prisma.design.update({
      where: { id: designId },
      data,
    });
  }

  /**
   * Met à jour le statut du design
   */
  private async updateDesignStatus(designId: string, status: string, error?: string): Promise<void> {
    await this.prisma.design.update({
      where: { id: designId },
      data: {
        status: status as any,
        ...(error && { metadata: { error, failedAt: new Date() } as any }),
      },
    });
  }

  /**
   * Calcule le coût
   */
  private calculateCost(usage: any): number {
    // Logique de calcul des coûts
    return (usage?.total_tokens || 0) * 0.0001 + (usage?.credits || 0) * 0.01;
  }

  /**
   * Analyse les performances du design
   */
  private async analyzeDesignPerformance(designId: string, options: any): Promise<any> {
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
  private calculateComplexity(options: any): number {
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
  private estimateRenderTime(options: any): number {
    const baseTime = 2000; // 2 secondes de base
    const complexity = this.calculateComplexity(options);
    return baseTime * complexity;
  }

  /**
   * Estime l'utilisation des ressources
   */
  private estimateResourceUsage(options: any): any {
    return {
      memory: this.calculateComplexity(options) * 100, // MB
      cpu: this.calculateComplexity(options) * 10, // %
      gpu: options.quality === 'ultra' ? 80 : 40, // %
    };
  }

  /**
   * Calcule le score de qualité
   */
  private calculateQualityScore(options: any): number {
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
  private async optimizeDesignOptions(options: any, performanceAnalysis: any): Promise<any> {
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
  private async generateOptimizationSuggestions(designId: string, originalOptions: any, optimizedOptions: any): Promise<string[]> {
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
  private async cacheDesignResults(designId: string, assets: any[]): Promise<void> {
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
  private async triggerSuccessWebhooks(designId: string, brandId: string, assets: any[]): Promise<void> {
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


