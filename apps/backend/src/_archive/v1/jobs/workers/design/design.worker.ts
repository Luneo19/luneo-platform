// @ts-nocheck
import * as crypto from 'crypto';
import { AIOrchestratorService, RoutingStrategy } from '@/libs/ai/ai-orchestrator.service';
import { PromptTemplatesService } from '@/libs/ai/prompt-templates.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { OutboxService } from '@/libs/outbox/outbox.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { ProductRulesService } from '@/modules/product-engine/services/product-rules.service';
import { ValidationEngine } from '@/modules/product-engine/services/validation-engine.service';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/** Design generation options (size, quality, style, etc.) */
export interface DesignOptions {
  occasion?: string;
  style?: string;
  size?: string;
  quality?: string;
  numImages?: number;
  previewMode?: boolean;
  exploration?: boolean;
  provider?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  zones?: Record<string, unknown>;
  effects?: string[];
  brandKit?: unknown;
  constraints?: unknown;
  [key: string]: unknown;
}

/** Product/design rules (zones, validation) */
export interface DesignRules {
  zones?: Array<{ type?: string }>;
  [key: string]: unknown;
}

interface DesignJobData {
  designId: string;
  productId: string;
  brandId: string;
  userId?: string;
  prompt: string;
  options: DesignOptions;
  rules: DesignRules;
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
    [key: string]: unknown;
  };
  costs: {
    tokens?: number;
    credits?: number;
    costCents?: number;
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
    private readonly outboxService: OutboxService,
    private readonly aiOrchestrator: AIOrchestratorService,
    private readonly promptTemplates: PromptTemplatesService,
  ) {}

  @Process('generate-design')
  async generateDesign(job: Job<DesignJobData>) {
    const { designId, productId, brandId, userId, prompt, options, rules, priority: _priority } = job.data;
    const startTime = Date.now();

    // Timeout: 30 secondes pour génération design
    const timeout = setTimeout(() => {
      this.logger.error(`Design generation timeout for ${designId} after 30s`);
      job.moveToFailed(new Error('Design generation timeout after 30s'), job.token || '');
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      clearTimeout(timeout);
      this.logger.error(`Design generation failed for ${designId}:`, error);

      // Mettre à jour le statut d'erreur
      await this.updateDesignStatus(designId, 'FAILED', errorMessage);

      // Publier événement d'erreur via Outbox
      await this.outboxService.publish('design.failed', {
        designId,
        brandId,
        userId,
        productId,
        error: errorMessage,
        failedAt: new Date(),
      });

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
      const validationResult = await this.validationEngine.validateDesign(validationContext as unknown as Parameters<ValidationEngine['validateDesign']>[0]);

      // Mettre à jour le design avec les résultats de validation
      await this.prisma.design.update({
        where: { id: designId },
        data: {
          metadata: {
            validation: validationResult as unknown as import('@prisma/client').Prisma.InputJsonValue,
            validatedAt: new Date(),
          },
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
    const { designId, productId: _productId, options } = job.data;

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
          options: optimizedOptions as unknown as import('@prisma/client').Prisma.InputJsonValue,
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

    } catch (error) {
      this.logger.error(`Design optimization failed for ${designId}:`, error);
      throw error;
    }
  }

  /**
   * Valide les règles du design
   */
  private async validateDesignRules(productId: string, options: DesignOptions, rules: DesignRules) {
    const validationContext = {
      productId,
      brandId: '', // Sera rempli par le job
      options,
      rules,
    };
    return this.validationEngine.validateDesign(validationContext as unknown as Parameters<ValidationEngine['validateDesign']>[0]);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.warn(`Moderation API failed, allowing prompt: ${errorMessage}`);
      return {
        isApproved: true,
        confidence: 0.5,
      };
    }
  }

  /**
   * Génère avec l'IA (utilise AIOrchestrator)
   */
  private async generateWithAI(
    prompt: string,
    options: DesignOptions,
    rules: DesignRules,
    brandId: string,
    productId?: string,
  ): Promise<AIGenerationResult> {
    const startTime = Date.now();

    try {
      // 1. Récupérer le template si occasion/style spécifiés
      let finalPrompt = prompt;
      if (options.occasion || options.style) {
        const template = await this.promptTemplates.getTemplate(
          options.occasion,
          options.style,
        );

        if (template) {
          // Récupérer les infos du produit pour le contexte
          let product: { name: string; description: string | null } | null = null;
          if (productId) {
            product = await this.prisma.product.findUnique({
              where: { id: productId },
              select: { name: true, description: true },
            });
          }

          const templateWithPrompt = template as { prompt: string; variables?: Record<string, unknown>; name?: string; version?: number };
          const context = {
            userInput: prompt,
            productName: product?.name,
            productDescription: product?.description ?? undefined,
            occasion: options.occasion,
            style: options.style,
            brandKit: options.brandKit as { colors?: string[]; tone?: string; forbidden?: string[] } | undefined,
            constraints: options.constraints as { engraving?: boolean; setting?: string } | undefined,
          };
          finalPrompt = this.promptTemplates.renderTemplate(templateWithPrompt, context);
          this.logger.debug(`Used prompt template: ${templateWithPrompt.name ?? 'unknown'} v${templateWithPrompt.version ?? 0}`);
        }
      }

      // 2. Modérer le prompt (déjà fait dans generateDesign, mais on peut re-vérifier)
      const moderation = await this.aiOrchestrator.moderatePrompt(finalPrompt);
      if (!moderation.isApproved) {
        throw new Error(`Prompt rejected: ${moderation.reason}`);
      }

      // 3. Déterminer la stratégie de routing
      const strategy: RoutingStrategy = {
        stage: (options.previewMode ? 'preview' : options.exploration ? 'exploration' : 'final') as 'exploration' | 'final' | 'preview',
        quality: (options.quality || 'standard') as 'standard' | 'hd',
        preferredProvider: options.provider,
      };

      // 4. Générer avec l'orchestrateur (routing intelligent)
      const result = await this.aiOrchestrator.generateImage(
        {
          prompt: finalPrompt,
          size: (options.size || '1024x1024') as '1024x1024' | '1792x1024' | '1024x1792',
          quality: (options.quality || 'standard') as 'standard' | 'hd',
          style: (options.style || 'natural') as 'vivid' | 'natural',
          n: options.numImages || 1,
        },
        strategy,
        brandId,
      );

      const generationTime = Date.now() - startTime;

      return {
        images: result.images,
        metadata: {
          ...result.metadata,
          generationTime,
          quality: (result.metadata as Record<string, unknown>)?.quality as string || options.quality || 'standard',
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

    } catch (error) {
      this.logger.error(`AI generation failed:`, error);
      throw error;
    }
  }

  /**
   * Sélectionne le modèle IA approprié
   */
  private selectAIModel(options: DesignOptions, rules: DesignRules): string {
    // Logique de sélection du modèle selon les besoins
    if (options.quality === 'ultra') {
      return 'dall-e-3';
    } else if (options.quality === 'high') {
      return 'midjourney-v6';
    } else if (rules.zones?.some((zone: { type?: string }) => zone.type === '3d')) {
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

  /** Response shape from callAIAPI (OpenAI or Replicate or placeholder) */
  private async callAIAPI(
    model: string,
    params: Record<string, unknown>,
  ): Promise<{
    images: Array<{ url: string; width: number; height: number; format: string; revisedPrompt?: string; isPlaceholder?: boolean }>;
    usage?: { total_tokens: number; credits: number };
    seed?: number;
    version?: string;
  }> {
    const sizeStr = typeof params.size === 'string' ? params.size : '1024x1024';
    const parseSize = (idx: number) => parseInt(sizeStr.split('x')[idx], 10) || 1024;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const replicateApiKey = process.env.REPLICATE_API_TOKEN;

    if (model === 'dall-e-3' && openaiApiKey === 'sk-placeholder') {
      this.logger.warn('OPENAI_API_KEY is a placeholder - returning mock result');
    }
    if (model === 'stable-diffusion-xl' && replicateApiKey === 'r8_placeholder') {
      this.logger.warn('REPLICATE_API_TOKEN is a placeholder - returning mock result');
    }

    // DALL-E 3 via OpenAI
    if (model === 'dall-e-3' && openaiApiKey && openaiApiKey !== 'sk-placeholder') {
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: params.prompt,
            n: 1,
            size: params.size || '1024x1024',
            quality: params.quality || 'standard',
            style: params.style || 'natural',
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { data: Array<{ url: string; revised_prompt?: string }> };
          return {
            images: data.data.map((img: { url: string; revised_prompt?: string }) => ({
              url: img.url,
              width: parseSize(0),
              height: parseSize(1),
              format: 'png',
              revisedPrompt: img.revised_prompt,
            })),
            usage: { total_tokens: 0, credits: params.quality === 'hd' ? 20 : 10 },
            seed: 0,
            version: 'dall-e-3',
          };
        }
      } catch (error) {
        this.logger.warn('DALL-E 3 API call failed, using fallback', { error });
      }
    }

    // Stable Diffusion XL via Replicate
    if (model === 'stable-diffusion-xl' && replicateApiKey && replicateApiKey !== 'r8_placeholder') {
      try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${replicateApiKey}`,
          },
          body: JSON.stringify({
            version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            input: {
              prompt: params.prompt,
              num_outputs: params.num_images || 1,
              width: parseSize(0),
              height: parseSize(1),
              num_inference_steps: params.steps || 30,
              guidance_scale: params.cfg_scale || 7.5,
              seed: params.seed,
            },
          }),
        });

        if (response.ok) {
          const prediction = await response.json();
          
          // Poll for completion
          let result = prediction;
          let attempts = 0;
          while ((result.status === 'starting' || result.status === 'processing') && attempts < 60) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusRes = await fetch(result.urls.get, {
              headers: { 'Authorization': `Token ${replicateApiKey}` },
            });
            result = await statusRes.json();
            attempts++;
          }

          if (result.status === 'succeeded' && result.output) {
            return {
              images: (result.output as string[]).map((url: string) => ({
                url,
                width: parseSize(0),
                height: parseSize(1),
                format: 'png',
              })),
              usage: { total_tokens: 0, credits: 5 },
              seed: typeof params.seed === 'number' ? params.seed : 0,
              version: 'sdxl-1.0',
            };
          }
        }
      } catch (error) {
        this.logger.warn('Replicate SDXL API call failed, using fallback', { error });
      }
    }

    // Fallback response when APIs are not configured
    this.logger.warn('No AI API configured or available, returning placeholder');
    return {
      images: [{
        url: '/images/placeholder-generated.png',
        width: parseSize(0),
        height: parseSize(1),
        format: 'png',
        isPlaceholder: true,
      }],
      usage: { total_tokens: 0, credits: 0 },
      seed: parseInt(crypto.randomBytes(4).toString('hex'), 16),
      version: 'placeholder',
    };
  }

  /**
   * Appelle l'API de modération
   */
  private async callModerationAPI(prompt: string): Promise<{ flagged: boolean; confidence: number; categories?: string[] }> {
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
  private async processAIResponse(response: { images: Array<{ url: string; width?: number; height?: number; format?: string }> }): Promise<Array<{
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
        width: imageData.width ?? 1024,
        height: imageData.height ?? 1024,
        format: imageData.format ?? 'png',
        size: imageBuffer.length,
      });
    }

    return images;
  }

  /**
   * Post-traite les images générées
   */
  private async postProcessImages(
    images: Array<{ url: string; width?: number; height?: number; format?: string }>,
    options: DesignOptions,
  ): Promise<Array<{ url: string; width?: number; height?: number; format?: string; processed?: boolean; effects?: string[] }>> {
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
    image: { url: string; width?: number; height?: number; format?: string },
    options: DesignOptions,
  ): Promise<{ url: string; width?: number; height?: number; format?: string; processed?: boolean; effects?: string[] }> {
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
    images: Array<{ url: string; width?: number; height?: number; format?: string }>,
    designId: string,
  ): Promise<Array<{ url: string; filename: string; size: number; format: string; width?: number; height?: number; index: number }>> {
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
          url: typeof uploadResult === 'string' ? uploadResult : String(uploadResult),
          filename,
          size: imageBuffer.length,
          format: image.format ?? 'png',
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
  private async createAssetRecords(designId: string, assets: Array<{ url: string; format: string; filename: string; size: number; width?: number; height?: number; index: number }>): Promise<void> {
    for (const asset of assets) {
      await this.prisma.asset.create({
        data: {
          designId,
          url: asset.url,
          type: asset.format,
          format: asset.format,
          size: asset.size,
          width: asset.width ?? undefined,
          height: asset.height ?? undefined,
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
  private async updateDesignWithResults(designId: string, data: Record<string, unknown>): Promise<void> {
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
        status: status as import('@prisma/client').DesignStatus,
        ...(error && { metadata: { error, failedAt: new Date() } }),
      },
    });
  }

  /**
   * Calcule le coût
   */
  private calculateCost(usage: Record<string, unknown> | undefined): number {
    const tokens = Number(usage?.total_tokens ?? 0);
    const credits = Number(usage?.credits ?? 0);
    return tokens * 0.0001 + credits * 0.01;
  }

  /**
   * Analyse les performances du design
   */
  private async analyzeDesignPerformance(
    designId: string,
    options: DesignOptions,
  ): Promise<{ complexity: number; estimatedRenderTime: number; resourceUsage: Record<string, number>; qualityScore: number }> {
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
  private estimateResourceUsage(options: DesignOptions): Record<string, number> {
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
    performanceAnalysis: { complexity: number; estimatedRenderTime: number; resourceUsage?: Record<string, number>; qualityScore?: number },
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
  private async generateOptimizationSuggestions(
    designId: string,
    originalOptions: DesignOptions,
    optimizedOptions: DesignOptions,
  ): Promise<string[]> {
    const suggestions = [];
    
    if (originalOptions.quality !== optimizedOptions.quality) {
      suggestions.push(`Qualité réduite de ${originalOptions.quality} à ${optimizedOptions.quality} pour améliorer les performances`);
    }
    
    const origLen = originalOptions.effects?.length ?? 0;
    const optLen = optimizedOptions.effects?.length ?? 0;
    if (origLen > optLen) {
      suggestions.push(`${origLen - optLen} effet(s) supprimé(s) pour réduire la complexité`);
    }
    
    return suggestions;
  }

  /**
   * Met en cache les résultats du design
   */
  private async cacheDesignResults(
    designId: string,
    assets: Array<{ url: string; filename: string; size: number; format: string; width?: number; height?: number; index: number }>,
  ): Promise<void> {
    const cacheKey = `design_results:${designId}`;
    const cacheData = {
      assets,
      cachedAt: new Date(),
    };
    
    await this.cache.setSimple(cacheKey, JSON.stringify(cacheData), 3600); // 1 heure
  }

}


