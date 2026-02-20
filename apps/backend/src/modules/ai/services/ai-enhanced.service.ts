/**
 * AI Enhanced Service – prompt optimization, provider routing, cost estimation, batch processing.
 * Enhances the AI Design Studio with circuit breaker routing and BullMQ-backed batches.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  AICapability,
  AIGenerationRequest,
  EnhancedAIProvider,
} from '../providers/base/ai-provider.interface';
import { ProviderRegistryService } from '../providers/base/provider-registry.service';
import { ProviderHealthService } from '../providers/base/provider-health.service';
import { CostEstimatorService } from '../cost-management/cost-estimator.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizePromptResult {
  enhancedPrompt: string;
  negativePrompt: string;
  suggestions: string[];
}

export interface RouteToProviderRequest {
  type: 'generation' | 'inpainting' | 'upscaling';
  capability?: AICapability;
  quality?: 'standard' | 'hd';
  maxCostCents?: number;
  preferProvider?: string;
}

export interface RouteToProviderResult {
  provider: string;
  model: string;
  estimatedCost: number;
  estimatedTime: number; // seconds
}

export interface CalculateCostRequest {
  provider: string;
  model: string;
  resolution?: string;
  steps?: number;
  operation?: string;
}

export interface CalculateCostResult {
  estimatedCredits: number;
  estimatedUSD: number;
  breakdown: { item: string; credits: number; usd: number }[];
}

export interface BatchItem {
  prompt: string;
  negativePrompt?: string;
  type: AICapability;
  size?: string;
  style?: string;
  userId?: string;
  brandId?: string;
}

export interface ProcessBatchOptions {
  concurrency?: number;
  priority?: number;
}

export interface ProcessBatchResult {
  batchId: string;
  totalItems: number;
  estimatedCost: number;
  estimatedDuration: number; // seconds
}

// Quality boosters and style hints
const QUALITY_BOOSTERS = ['high quality', 'professional', 'detailed', 'sharp focus'];
const STYLE_KEYWORDS: Record<string, string[]> = {
  photorealistic: ['photorealistic', '8k', 'realistic lighting', 'hyperdetailed'],
  artistic: ['artistic', 'creative', 'stylized', 'aesthetic'],
  minimal: ['minimalist', 'clean', 'simple', 'elegant'],
  product: ['product photography', 'studio lighting', 'white background', 'commercial'],
};

const DEFAULT_NEGATIVE =
  'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class AIEnhancedService {
  private readonly logger = new Logger(AIEnhancedService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ai-generation') private readonly aiQueue: Queue,
    private readonly registry: ProviderRegistryService,
    private readonly providerHealth: ProviderHealthService,
    private readonly costEstimator: CostEstimatorService,
  ) {}

  /**
   * Enriches a user prompt with quality boosters, inferred negative prompt, and style-specific keywords.
   */
  optimizePrompt(
    rawPrompt: string,
    style?: string,
    negativePrompt?: string,
  ): OptimizePromptResult {
    const trimmed = rawPrompt.trim();
    const suggestions: string[] = [];
    const boostersToAdd = QUALITY_BOOSTERS.filter(
      (b) => !trimmed.toLowerCase().includes(b),
    );
    const enhancedParts: string[] = [trimmed];
    if (boostersToAdd.length > 0) {
      enhancedParts.push(boostersToAdd.slice(0, 2).join(', '));
      suggestions.push(`Added quality: ${boostersToAdd.slice(0, 2).join(', ')}`);
    }
    if (style && STYLE_KEYWORDS[style]) {
      const styleWords = STYLE_KEYWORDS[style].slice(0, 2);
      enhancedParts.push(styleWords.join(', '));
      suggestions.push(`Style "${style}": ${styleWords.join(', ')}`);
    }
    const enhancedPrompt = enhancedParts.join('. ');
    const finalNegative =
      negativePrompt?.trim() || DEFAULT_NEGATIVE;
    if (!negativePrompt?.trim()) {
      suggestions.push(`Negative prompt: ${finalNegative.slice(0, 60)}...`);
    }
    return {
      enhancedPrompt,
      negativePrompt: finalNegative,
      suggestions,
    };
  }

  /**
   * Routes to the best provider with circuit breaker and fallback chain.
   */
  async routeToProvider(request: RouteToProviderRequest): Promise<RouteToProviderResult> {
    const capability =
      request.capability ??
      (request.type === 'upscaling'
        ? AICapability.UPSCALE
        : request.type === 'inpainting'
          ? AICapability.INPAINTING
          : AICapability.IMAGE_2D);

    const genRequest: AIGenerationRequest = {
      type: capability,
      prompt: 'placeholder',
      quality: request.quality ?? 'standard',
    };

    const candidates = this.registry.getByCapability(capability);
    if (candidates.length === 0) {
      throw new Error(`No providers registered for ${capability}`);
    }

    const available = candidates.filter(
      (p: EnhancedAIProvider) => !this.providerHealth.isCircuitOpen(p.getName()),
    );
    const list = available.length > 0 ? available : candidates;

    const preferCost = (request.maxCostCents ?? 0) > 0;
    const scored = this.scoreProviders(list, genRequest, {
      preferProvider: request.preferProvider,
      preferQuality: request.quality === 'hd',
      preferCost,
    });

    for (const { provider } of scored) {
      const name = provider.getName();
      const config = provider.getConfig();
      const model =
        config.name === 'replicate-sdxl'
          ? 'sdxl-1.0'
          : config.name === 'openai'
            ? 'dall-e-3'
            : config.name;
      const est = provider.estimateCost(genRequest);
      const estimatedTime =
        capability === AICapability.UPSCALE ? 20 : capability === AICapability.VIDEO ? 60 : 35;
      if (
        request.maxCostCents != null &&
        est.costCents > request.maxCostCents
      ) {
        continue;
      }
      return {
        provider: name,
        model,
        estimatedCost: est.credits,
        estimatedTime,
      };
    }

    throw new Error(
      `No available provider for ${capability}${request.maxCostCents != null ? ' within cost limit' : ''}`,
    );
  }

  private scoreProviders(
    providers: EnhancedAIProvider[],
    request: AIGenerationRequest,
    options: {
      preferProvider?: string;
      preferQuality: boolean;
      preferCost: boolean;
    },
  ): Array<{ provider: EnhancedAIProvider; score: number }> {
    const qualityWeight = options.preferQuality ? 0.6 : 0.4;
    const costWeight = options.preferCost ? 0.6 : 0.4;
    return providers
      .map((provider) => {
        const est = provider.estimateCost(request);
        const config = provider.getConfig();
        const priorityScore = 1 - (config.priority - 1) / Math.max(1, config.priority);
        const costScore = 1 - Math.min(1, est.costCents / 100);
        let score =
          qualityWeight * priorityScore + costWeight * costScore;
        if (options.preferProvider && provider.getName() === options.preferProvider) {
          score += 0.5;
        }
        return { provider, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Predicts generation cost from provider, model, resolution, and steps.
   */
  async calculateCost(request: CalculateCostRequest): Promise<CalculateCostResult> {
    const operation = request.operation ?? 'generate';
    const estimate = await this.costEstimator.estimateCost(
      request.provider,
      request.model,
      operation,
    );
    const steps = request.steps ?? 30;
    const stepFactor = Math.min(2, Math.max(0.5, steps / 30));
    const credits = Math.ceil(estimate.credits * stepFactor);
    const usd = (estimate.costCents / 100) * (steps / 30);
    const breakdown: CalculateCostResult['breakdown'] = [
      { item: 'base', credits: estimate.credits, usd: estimate.costCents / 100 },
      {
        item: 'steps_factor',
        credits: Math.ceil(estimate.credits * (stepFactor - 1)),
        usd: usd - estimate.costCents / 100,
      },
    ];
    return {
      estimatedCredits: credits,
      estimatedUSD: Number(usd.toFixed(4)),
      breakdown,
    };
  }

  /**
   * Validates batch items and enqueues them; progress is tracked via BullMQ.
   */
  async processBatch(
    items: BatchItem[],
    options: ProcessBatchOptions = {},
  ): Promise<ProcessBatchResult> {
    if (!items?.length) {
      throw new Error('Batch must contain at least one item');
    }
    const concurrency = options.concurrency ?? 3;
    const priority = options.priority ?? 0;

    let totalCredits = 0;
    let totalDurationSec = 0;

    for (const item of items) {
      if (!item.prompt?.trim() || !item.type) {
        throw new Error(`Invalid batch item: prompt and type required`);
      }
      try {
        const route = await this.routeToProvider({
          type: 'generation',
          capability: item.type,
          quality: item.size?.includes('1024') ? 'hd' : 'standard',
        });
        const cost = await this.calculateCost({
          provider: route.provider,
          model: route.model,
          steps: 30,
        });
        totalCredits += cost.estimatedCredits;
        totalDurationSec += route.estimatedTime;
      } catch {
        totalCredits += 5;
        totalDurationSec += 45;
      }
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    for (let i = 0; i < items.length; i++) {
      await this.aiQueue.add(
        'batch-generation',
        {
          batchId,
          index: i,
          total: items.length,
          ...items[i],
        },
        {
          priority: priority - i,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 200,
          removeOnFail: 100,
        },
      );
    }

    this.logger.log(
      `Batch ${batchId}: ${items.length} items, ~${totalCredits} credits, ~${totalDurationSec}s`,
    );

    return {
      batchId,
      totalItems: items.length,
      estimatedCost: totalCredits,
      estimatedDuration: Math.ceil(totalDurationSec / concurrency),
    };
  }
}
