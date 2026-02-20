import { Injectable, Logger } from '@nestjs/common';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import {
  AICapability,
  AIGenerationRequest,
  AIGenerationResponse,
  EnhancedAIProvider,
  ProviderStatus,
} from '@/modules/ai/providers/base/ai-provider.interface';
import { ProviderRegistryService } from '@/modules/ai/providers/base/provider-registry.service';

const HEALTH_CACHE_TTL = 60;
const ROUTING_ANALYTICS_KEY_PREFIX = 'ai:routing:analytics:';
const HEALTH_KEY_PREFIX = 'ai:provider:';

export interface RouteOptions {
  preferProvider?: string;
  preferQuality?: boolean;
  preferCost?: boolean;
}

interface CachedHealth {
  status: ProviderStatus;
  cachedAt: number;
}

@Injectable()
export class IntelligentRouterService {
  private readonly logger = new Logger(IntelligentRouterService.name);

  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly redis: RedisOptimizedService,
  ) {}

  async route(
    request: AIGenerationRequest,
    options: RouteOptions = {},
  ): Promise<AIGenerationResponse> {
    const { preferProvider, preferQuality = true, preferCost = false } = options;

    const candidates = this.registry.getByCapability(request.type);
    if (candidates.length === 0) {
      throw new Error(
        `No providers registered for capability ${request.type}`,
      );
    }

    const available = await this.filterByCachedAvailability(
      candidates,
      request.type,
    );
    const list = available.length > 0 ? available : candidates;

    const scored = this.scoreProviders(list, request, {
      preferQuality,
      preferCost,
      preferProvider,
    });

    if (scored.length === 0) {
      throw new Error(
        `No available providers for capability ${request.type}`,
      );
    }

    let lastError: Error | null = null;
    let chosenProviderName: string | null = null;

    for (const { provider } of scored) {
      chosenProviderName = provider.getName();
      try {
        this.logger.debug(
          `Routing ${request.type} to provider: ${chosenProviderName}`,
        );
        const result = await provider.generate(request);
        await this.recordRoutingDecision(
          request.type,
          chosenProviderName,
          true,
          result.metadata.generationTimeMs,
        );
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        await this.recordRoutingDecision(
          request.type,
          chosenProviderName,
          false,
          0,
        );
        await this.markProviderHealthCache(chosenProviderName, false);
        this.logger.warn(
          `Provider ${chosenProviderName} failed, trying next: ${lastError.message}`,
        );
      }
    }

    throw (
      lastError ??
      new Error(`All providers failed for capability ${request.type}`)
    );
  }

  private async filterByCachedAvailability(
    providers: EnhancedAIProvider[],
    _capability: AICapability,
  ): Promise<EnhancedAIProvider[]> {
    const result: EnhancedAIProvider[] = [];

    for (const provider of providers) {
      const key = `${HEALTH_KEY_PREFIX}${provider.getName()}:health`;
      const cached = await this.redis.get<CachedHealth>(key, 'api');
      if (cached && cached.status === ProviderStatus.UNAVAILABLE) {
        const ageSeconds = (Date.now() - cached.cachedAt) / 1000;
        if (ageSeconds < HEALTH_CACHE_TTL) {
          continue;
        }
      }
      try {
        const available = await provider.isAvailable();
        if (available) {
          result.push(provider);
          await this.markProviderHealthCache(provider.getName(), true);
        } else {
          await this.markProviderHealthCache(provider.getName(), false);
        }
      } catch {
        await this.markProviderHealthCache(provider.getName(), false);
      }
    }

    return result;
  }

  private async markProviderHealthCache(
    providerName: string,
    healthy: boolean,
  ): Promise<void> {
    const key = `${HEALTH_KEY_PREFIX}${providerName}:health`;
    const data: CachedHealth = {
      status: healthy ? ProviderStatus.HEALTHY : ProviderStatus.UNAVAILABLE,
      cachedAt: Date.now(),
    };
    await this.redis.set(key, data, 'api', { ttl: HEALTH_CACHE_TTL });
  }

  private scoreProviders(
    providers: EnhancedAIProvider[],
    request: AIGenerationRequest,
    options: { preferQuality: boolean; preferCost: boolean; preferProvider?: string },
  ): Array<{ provider: EnhancedAIProvider; score: number }> {
    const qualityWeight = options.preferQuality ? 0.6 : 0.4;
    const costWeight = options.preferCost ? 0.6 : 0.4;

    const costs = providers.map((p) => {
      const est = p.estimateCost(request);
      return { provider: p, costCents: est.costCents, priority: p.getConfig().priority };
    });

    const maxCost = Math.max(...costs.map((c) => c.costCents), 1);
    const maxPriority = Math.max(...costs.map((c) => c.priority), 1);

    const scored = costs.map(({ provider, costCents, priority }) => {
      const priorityScore = 1 - (priority - 1) / maxPriority;
      const inverseCostScore = 1 - costCents / maxCost;
      const score =
        qualityWeight * priorityScore + costWeight * inverseCostScore;
      let finalScore = score;
      if (options.preferProvider && provider.getName() === options.preferProvider) {
        finalScore += 0.5;
      }
      return { provider, score: finalScore };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  private async recordRoutingDecision(
    capability: AICapability,
    providerName: string,
    success: boolean,
    generationTimeMs: number,
  ): Promise<void> {
    const key = `${ROUTING_ANALYTICS_KEY_PREFIX}${capability}:${providerName}`;
    try {
      const existing = await this.redis.get<{
        successCount: number;
        failureCount: number;
        totalTimeMs: number;
      }>(key, 'api');
      const data = {
        successCount: (existing?.successCount ?? 0) + (success ? 1 : 0),
        failureCount: (existing?.failureCount ?? 0) + (success ? 0 : 1),
        totalTimeMs: (existing?.totalTimeMs ?? 0) + generationTimeMs,
      };
      await this.redis.set(key, data, 'api', { ttl: 86400 });
    } catch (err) {
      this.logger.debug(
        `Failed to record routing decision: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
