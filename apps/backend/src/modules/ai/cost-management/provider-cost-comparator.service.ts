import { Injectable, Logger } from '@nestjs/common';
import { CostEstimatorService } from './cost-estimator.service';

export interface OptimalProviderSuggestion {
  provider: string;
  model: string;
  costCents: number;
  qualityScore: number;
  reason: string;
}

const PROVIDER_QUALITY_SCORES: Record<string, number> = {
  openai: 0.95,
  stability: 0.88,
  replicate: 0.85,
  meshy: 0.82,
  runway: 0.9,
};

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  openai: 'dall-e-3',
  stability: 'sdxl-1.0',
  replicate: 'sdxl',
  meshy: 'meshy-v2',
  runway: 'gen3a_turbo',
};

const OPERATION_PROVIDERS: Record<string, string[]> = {
  generate: ['openai', 'stability', 'replicate'],
  'generate-hd': ['openai'],
  upscale: ['replicate'],
  'remove-bg': ['replicate'],
  animate: ['runway'],
  '3d': ['meshy'],
};

@Injectable()
export class ProviderCostComparatorService {
  private readonly logger = new Logger(ProviderCostComparatorService.name);

  constructor(private readonly costEstimator: CostEstimatorService) {}

  async suggestOptimalProvider(
    operation: string,
    qualityMinimum: number = 0,
  ): Promise<OptimalProviderSuggestion> {
    const providers =
      OPERATION_PROVIDERS[operation] ??
      Object.keys(PROVIDER_QUALITY_SCORES);

    const candidates = await Promise.all(
      providers.map(async (provider) => {
        const model =
          PROVIDER_DEFAULT_MODELS[provider] ?? 'default';
        const estimate = await this.costEstimator.estimateCost(
          provider,
          model,
          operation,
        );
        const qualityScore = PROVIDER_QUALITY_SCORES[provider] ?? 0.5;
        return {
          provider,
          model,
          costCents: estimate.costCents,
          qualityScore,
        };
      }),
    );

    const meetingQuality = candidates.filter(
      (c) => c.qualityScore >= qualityMinimum,
    );
    const pool = meetingQuality.length > 0 ? meetingQuality : candidates;
    const sorted = pool.sort(
      (a, b) => a.costCents - b.costCents || b.qualityScore - a.qualityScore,
    );
    const best = sorted[0];

    const reason =
      qualityMinimum > 0 && meetingQuality.length === 0
        ? `No provider meets minimum quality ${qualityMinimum}; suggesting cheapest available.`
        : `Lowest cost among providers meeting quality (min ${qualityMinimum}).`;

    return {
      provider: best.provider,
      model: best.model,
      costCents: best.costCents,
      qualityScore: best.qualityScore,
      reason,
    };
  }
}
