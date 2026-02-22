// @ts-nocheck
/**
 * ★★★ WORKER - AI STUDIO ★★★
 * Worker BullMQ pour les générations AI Studio (2D, 3D, animations, templates)
 * Respecte les patterns existants du projet
 */

import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AIOrchestratorService } from '@/libs/ai/ai-orchestrator.service';
import { AiService } from '@/modules/ai/ai.service';
import { MeshyProviderService } from '@/modules/ai/services/meshy-provider.service';
import { RunwayProviderService } from '@/modules/ai/services/runway-provider.service';
import { AIGenerationStatus, AIGenerationType } from '@prisma/client';

/** Job parameters for AI generation (quality, style, aspectRatio, duration, etc.) */
export interface AIStudioJobParameters {
  quality?: string;
  style?: string;
  aspectRatio?: string;
  duration?: number;
  referenceImageUrl?: string;
  meshyTaskId?: string;
  runwayTaskId?: string;
  [key: string]: unknown;
}

export interface AIGenerationJob {
  generationId: string;
  type: AIGenerationType;
  prompt: string;
  negativePrompt?: string;
  model: string;
  provider: string;
  parameters: AIStudioJobParameters;
  userId: string;
  brandId: string;
}

/** Base URL for generation result assets. Uses Cloudinary when configured, else STORAGE_BASE_URL or fallback. */
function getStorageBaseUrl(): string {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
  }
  return process.env.STORAGE_BASE_URL || 'https://storage.luneo.app';
}

@Injectable()
@Processor('ai-generation')
export class AIStudioWorker {
  private readonly logger = new Logger(AIStudioWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiOrchestrator: AIOrchestratorService,
    private readonly aiService: AiService,
    private readonly meshyProvider: MeshyProviderService,
    private readonly runwayProvider: RunwayProviderService,
  ) {}

  @Process('generate-ai-studio')
  async handleAIGeneration(job: Job<AIGenerationJob>) {
    const { generationId, type, prompt, negativePrompt, model, provider, parameters, userId, brandId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing AI generation ${generationId} of type ${type}`);

    try {
      // Mettre à jour le statut à PROCESSING
      await this.prisma.aIGeneration.update({
        where: { id: generationId },
        data: { status: AIGenerationStatus.PROCESSING },
      });

      // Vérifier le budget (déjà fait avant le job, mais double vérification)
      const estimatedCost = await this.aiService.estimateCost(prompt, parameters);
      await this.aiService.checkBudgetOrThrow(brandId, estimatedCost);

      // Vérifier le quota utilisateur
      const hasQuota = await this.aiService.checkUserQuota(userId, estimatedCost);
      if (!hasQuota) {
        throw new Error(`User quota exceeded for generation ${generationId}`);
      }

      // Générer selon le type
      let resultUrl: string;
      let thumbnailUrl: string;
      let quality: number | null = null;
      let tokensFromProvider: number | null = null;

      switch (type) {
        case AIGenerationType.IMAGE_2D: {
          const out = await this.generateImage2D(prompt, negativePrompt, model, parameters, brandId);
          resultUrl = out.resultUrl;
          thumbnailUrl = out.thumbnailUrl;
          quality = out.quality;
          tokensFromProvider = out.tokens ?? null;
          break;
        }
        case AIGenerationType.MODEL_3D:
          ({ resultUrl, thumbnailUrl, quality } = await this.generateModel3D(generationId, prompt, negativePrompt, model, parameters));
          break;
        case AIGenerationType.ANIMATION:
          ({ resultUrl, thumbnailUrl, quality } = await this.generateAnimation(generationId, prompt, negativePrompt, model, parameters));
          break;
        case AIGenerationType.TEMPLATE:
          ({ resultUrl, thumbnailUrl, quality } = await this.generateTemplate(prompt, negativePrompt, model, parameters));
          break;
        default:
          throw new Error(`Unsupported generation type: ${type}`);
      }

      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Tokens: from provider response when available, else estimate from input/output length (~4 chars per token)
      const tokensUsed =
        tokensFromProvider ??
        Math.ceil((prompt.length + (typeof resultUrl === 'string' ? resultUrl.length : 0)) / 4);

      // Calculer le coût réel
      const actualCost = await this.calculateActualCost(type, model, parameters, duration);

      // Mettre à jour la génération avec les résultats
      await this.prisma.aIGeneration.update({
        where: { id: generationId },
        data: {
          status: AIGenerationStatus.COMPLETED,
          resultUrl,
          thumbnailUrl,
          quality,
          duration,
          costCents: actualCost,
          completedAt: new Date(),
        },
      });

      // Mettre à jour le quota utilisateur
      await this.aiService.updateUserQuota(userId, actualCost);

      // Enregistrer le coût AI (tokens from provider or estimated)
      await this.aiService.recordAICost(brandId, provider, model, actualCost, {
        tokens: tokensUsed,
        duration,
        type,
      });

      this.logger.log(`AI generation ${generationId} completed successfully in ${duration}s`);

      return {
        success: true,
        generationId,
        resultUrl,
        thumbnailUrl,
        quality,
        duration,
        costCents: actualCost,
      };
    } catch (error) {
      this.logger.error(`Failed to generate AI ${generationId}:`, error);

      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Mettre à jour le statut à FAILED (generic message to avoid leaking internal errors)
      await this.prisma.aIGeneration.update({
        where: { id: generationId },
        data: {
          status: AIGenerationStatus.FAILED,
          error: 'Generation processing failed',
          duration,
        },
      });

      throw error;
    }
  }

  /**
   * Génère une image 2D
   */
  private async generateImage2D(
    prompt: string,
    negativePrompt: string | undefined,
    model: string,
    parameters: AIStudioJobParameters,
    brandId: string,
  ): Promise<{ resultUrl: string; thumbnailUrl: string; quality: number; tokens?: number }> {
    // Utiliser l'orchestrator pour router vers le bon provider
    const strategy = {
      stage: (parameters.quality === 'ultra' ? 'final' : 'preview') as 'exploration' | 'final' | 'preview',
      quality: (parameters.quality === 'ultra' ? 'hd' : 'standard') as 'standard' | 'hd',
    };

    const result = await this.aiOrchestrator.generateImage(
      {
        prompt,
        size: (parameters.aspectRatio as '1024x1024' | '1792x1024' | '1024x1792') || '1024x1024',
        style: (parameters.style as 'vivid' | 'natural') || 'vivid',
      },
      strategy,
      brandId,
    );

    const tokens = result.costs?.tokens ?? undefined;

    return {
      resultUrl: result.images[0]?.url || '',
      thumbnailUrl: result.images[0]?.url || '',
      quality: 85,
      ...(tokens != null && { tokens }),
    };
  }

  /**
   * Génère un modèle 3D — Meshy when configured and taskId present, else stub
   */
  private async generateModel3D(
    generationId: string,
    _prompt: string,
    _negativePrompt: string | undefined,
    _model: string,
    _parameters: AIStudioJobParameters,
  ): Promise<{ resultUrl: string; thumbnailUrl: string; quality: number }> {
    const generation = await this.prisma.aIGeneration.findUnique({
      where: { id: generationId },
    });
    const params = (generation?.parameters as Record<string, unknown>) || {};
    const meshyTaskId = params.meshyTaskId as string | undefined;

    if (this.meshyProvider.isConfigured && meshyTaskId) {
      const task = await this.meshyProvider.pollUntilComplete(meshyTaskId);
      const resultUrl = task.model_urls?.glb || task.model_urls?.obj || '';
      const thumbnailUrl = task.thumbnail_url || resultUrl;
      if (!resultUrl) {
        throw new Error('Meshy succeeded but no model URL returned');
      }
      return {
        resultUrl,
        thumbnailUrl,
        quality: 90,
      };
    }

    // PRODUCTION FIX: No silent stub - throw explicit error when provider is not configured
    throw new Error(
      'Meshy 3D provider is not configured or no taskId provided. ' +
      'Set MESHY_API_KEY environment variable and ensure a Meshy task was created before processing.',
    );
  }

  /**
   * Génère une animation — Runway when configured and taskId present, else stub
   */
  private async generateAnimation(
    generationId: string,
    _prompt: string,
    _negativePrompt: string | undefined,
    _model: string,
    _parameters: AIStudioJobParameters,
  ): Promise<{ resultUrl: string; thumbnailUrl: string; quality: number }> {
    const generation = await this.prisma.aIGeneration.findUnique({
      where: { id: generationId },
    });
    const params = (generation?.parameters as Record<string, unknown>) || {};
    const runwayTaskId = params.runwayTaskId as string | undefined;

    if (this.runwayProvider.isConfigured && runwayTaskId) {
      const { videoUrl } = await this.runwayProvider.pollUntilComplete(runwayTaskId);
      return {
        resultUrl: videoUrl,
        thumbnailUrl: videoUrl,
        quality: 88,
      };
    }

    // PRODUCTION FIX: No silent stub - throw explicit error when provider is not configured
    throw new Error(
      'Runway animation provider is not configured or no taskId provided. ' +
      'Set RUNWAY_API_KEY environment variable and ensure a Runway task was created before processing.',
    );
  }

  /**
   * Génère un template design via OpenAI (image from prompt) ou mock si API key non configurée.
   */
  private async generateTemplate(
    prompt: string,
    _negativePrompt: string | undefined,
    _model: string,
    _parameters: AIStudioJobParameters,
  ): Promise<{ resultUrl: string; thumbnailUrl: string; quality: number }> {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey || openaiApiKey === 'sk-placeholder') {
      this.logger.warn('OPENAI_API_KEY is a placeholder - returning mock result');
      const baseUrl = getStorageBaseUrl();
      return {
        resultUrl: `${baseUrl}/templates/placeholder.png`,
        thumbnailUrl: `${baseUrl}/templates/placeholder.png`,
        quality: 75,
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt.slice(0, 4000),
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI template image failed: ${response.status} ${errText}`);
      }

      const data = (await response.json()) as { data?: Array<{ url?: string }> };
      const url = data?.data?.[0]?.url;
      if (!url) {
        throw new Error('OpenAI did not return an image URL');
      }

      return {
        resultUrl: url,
        thumbnailUrl: url,
        quality: 85,
      };
    } catch (error) {
      this.logger.warn(
        `Template generation via OpenAI failed, returning mock: ${error instanceof Error ? error.message : String(error)}`,
      );
      const baseUrl = getStorageBaseUrl();
      return {
        resultUrl: `${baseUrl}/templates/placeholder.png`,
        thumbnailUrl: `${baseUrl}/templates/placeholder.png`,
        quality: 75,
      };
    }
  }

  /**
   * Calcule le coût réel de la génération
   */
  private async calculateActualCost(
    type: AIGenerationType,
    _model: string,
    parameters: AIStudioJobParameters,
    duration: number,
  ): Promise<number> {
    // Coût de base selon le type
    let baseCost = 0.08; // 8 centimes de base
    if (type === AIGenerationType.MODEL_3D) baseCost = 0.15;
    if (type === AIGenerationType.ANIMATION) baseCost = 0.20;

    // Multiplicateur selon la qualité
    const qualityMultiplier = parameters.quality === 'ultra' ? 2 : parameters.quality === 'high' ? 1.5 : 1;

    // Coût selon la durée (plus long = plus cher)
    const durationCost = duration * 0.01; // 1 centime par seconde

    return Math.round((baseCost + durationCost) * qualityMultiplier * 100);
  }

  /**
   * Simule une génération (pour tests)
   */
  private async simulateGeneration(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

