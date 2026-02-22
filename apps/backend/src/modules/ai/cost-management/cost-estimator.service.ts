// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface CostEstimate {
  provider: string;
  model: string;
  operation: string;
  costCents: number;
  credits: number;
  currency: string;
}

@Injectable()
export class CostEstimatorService {
  private readonly logger = new Logger(CostEstimatorService.name);
  private pricingCache: Map<string, { cost: number; cachedAt: number }> =
    new Map();
  private readonly CACHE_TTL_MS = 300000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  async estimateCost(
    provider: string,
    model: string,
    operation: string,
  ): Promise<CostEstimate> {
    const cacheKey = `${provider}:${model}:${operation}`;
    const cached = this.pricingCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      return {
        provider,
        model,
        operation,
        costCents: Math.ceil(cached.cost * 100),
        credits: this.costToCredits(cached.cost),
        currency: 'EUR',
      };
    }

    try {
      const pricing = await this.prisma.aIProviderPricing.findFirst({
        where: {
          provider,
          model,
          operation,
          isActive: true,
        },
        orderBy: { effectiveDate: 'desc' },
      });

      const costPerUnit =
        pricing?.costPerUnit ?? this.getDefaultCost(provider, operation);

      this.pricingCache.set(cacheKey, {
        cost: costPerUnit,
        cachedAt: Date.now(),
      });

      return {
        provider,
        model,
        operation,
        costCents: Math.ceil(costPerUnit * 100),
        credits: this.costToCredits(costPerUnit),
        currency: 'EUR',
      };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch pricing for ${cacheKey}, using defaults`,
        {
          error: error instanceof Error ? error.message : error,
        },
      );
      const defaultCost = this.getDefaultCost(provider, operation);
      return {
        provider,
        model,
        operation,
        costCents: Math.ceil(defaultCost * 100),
        credits: this.costToCredits(defaultCost),
        currency: 'EUR',
      };
    }
  }

  async compareProviderCosts(
    operation: string,
    providers: string[],
  ): Promise<CostEstimate[]> {
    const estimates = await Promise.all(
      providers.map(async (provider) => {
        const model = this.getDefaultModel(provider, operation);
        return this.estimateCost(provider, model, operation);
      }),
    );
    return estimates.sort((a, b) => a.costCents - b.costCents);
  }

  private costToCredits(costEur: number): number {
    // 1 credit ≈ 0.019 EUR (pack 100 credits = 1.90 EUR)
    const costCents = costEur * 100;
    return Math.max(1, Math.ceil(costCents / 1.9));
  }

  private getDefaultCost(provider: string, operation: string): number {
    const defaults: Record<string, Record<string, number>> = {
      openai: { generate: 0.04, 'generate-hd': 0.08 },
      stability: { generate: 0.015 },
      replicate: {
        generate: 0.015,
        upscale: 0.005,
        'remove-bg': 0.01,
      },
      meshy: { '3d': 0.2 },
      runway: { animate: 0.5 },
    };
    return defaults[provider]?.[operation] ?? 0.02;
  }

  private getDefaultModel(provider: string, _operation: string): string {
    const models: Record<string, string> = {
      openai: 'dall-e-3',
      stability: 'sdxl-1.0',
      replicate: 'sdxl',
      meshy: 'meshy-v2',
      runway: 'gen3a_turbo',
    };
    return models[provider] ?? 'default';
  }

  clearCache(): void {
    this.pricingCache.clear();
  }
}
