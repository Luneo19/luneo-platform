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
import { AIGenerationStatus, AIGenerationType } from '@prisma/client';

export interface AIGenerationJob {
  generationId: string;
  type: AIGenerationType;
  prompt: string;
  negativePrompt?: string;
  model: string;
  provider: string;
  parameters: any;
  userId: string;
  brandId: string;
}

@Injectable()
@Processor('ai-generation')
export class AIStudioWorker {
  private readonly logger = new Logger(AIStudioWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiOrchestrator: AIOrchestratorService,
    private readonly aiService: AiService,
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
      let duration: number;
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
          ({ resultUrl, thumbnailUrl, quality } = await this.generateModel3D(prompt, negativePrompt, model, parameters));
          break;
        case AIGenerationType.ANIMATION:
          ({ resultUrl, thumbnailUrl, quality } = await this.generateAnimation(prompt, negativePrompt, model, parameters));
          break;
        case AIGenerationType.TEMPLATE:
          ({ resultUrl, thumbnailUrl, quality } = await this.generateTemplate(prompt, negativePrompt, model, parameters));
          break;
        default:
          throw new Error(`Unsupported generation type: ${type}`);
      }

      duration = Math.floor((Date.now() - startTime) / 1000);

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

      // Mettre à jour le statut à FAILED
      await this.prisma.aIGeneration.update({
        where: { id: generationId },
        data: {
          status: AIGenerationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
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
    parameters: any,
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
        size: parameters.aspectRatio || '1024x1024',
        style: parameters.style || 'vivid',
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
   * Génère un modèle 3D — stub: crée des entrées placeholder pour traitement externe ultérieur
   */
  private async generateModel3D(
    _prompt: string,
    _negativePrompt: string | undefined,
    _model: string,
    _parameters: any,
  ): Promise<{ resultUrl: string; thumbnailUrl: string; quality: number }> {
    await this.simulateGeneration(5000);
    const id = Date.now();
    return {
      resultUrl: `https://storage.example.com/generations/3d/${id}.glb`,
      thumbnailUrl: `https://storage.example.com/generations/3d/${id}_thumb.png`,
      quality: 90,
    };
  }

  /**
   * Génère une animation — stub: placeholder pour traitement externe
   */
  private async generateAnimation(
    _prompt: string,
    _negativePrompt: string | undefined,
    _model: string,
    _parameters: any,
  ): Promise<{ resultUrl: string; thumbnailUrl: string; quality: number }> {
    await this.simulateGeneration(8000);
    const id = Date.now();
    return {
      resultUrl: `https://storage.example.com/generations/animations/${id}.mp4`,
      thumbnailUrl: `https://storage.example.com/generations/animations/${id}_thumb.png`,
      quality: 88,
    };
  }

  /**
   * Génère un template — stub: placeholder pour traitement externe
   */
  private async generateTemplate(
    _prompt: string,
    _negativePrompt: string | undefined,
    _model: string,
    _parameters: any,
  ): Promise<{ resultUrl: string; thumbnailUrl: string; quality: number }> {
    await this.simulateGeneration(3000);
    const id = Date.now();
    return {
      resultUrl: `https://storage.example.com/generations/templates/${id}.json`,
      thumbnailUrl: `https://storage.example.com/generations/templates/${id}_thumb.png`,
      quality: 85,
    };
  }

  /**
   * Calcule le coût réel de la génération
   */
  private async calculateActualCost(
    type: AIGenerationType,
    model: string,
    parameters: any,
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

