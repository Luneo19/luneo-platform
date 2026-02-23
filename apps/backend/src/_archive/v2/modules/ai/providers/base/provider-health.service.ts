import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProviderRegistryService } from './provider-registry.service';
import {
  ProviderHealthInfo,
  ProviderStatus,
} from './ai-provider.interface';

@Injectable()
export class ProviderHealthService {
  private readonly logger = new Logger(ProviderHealthService.name);
  private readonly circuitBreakers = new Map<
    string,
    { failures: number; openUntil: Date | null }
  >();

  constructor(
    private readonly registry: ProviderRegistryService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAllProviders(): Promise<void> {
    const providers = this.registry.getAll();
    for (const provider of providers) {
      try {
        const health = await provider.getHealth();
        const cacheKey = `ai:provider:${provider.getName()}:health`;
        await this.cacheManager.set(
          cacheKey,
          JSON.stringify(health),
          120000,
        );

        // Circuit breaker logic
        const cb =
          this.circuitBreakers.get(provider.getName()) || {
            failures: 0,
            openUntil: null,
          };
        if (health.status === ProviderStatus.UNAVAILABLE) {
          cb.failures++;
          if (cb.failures >= 3) {
            cb.openUntil = new Date(Date.now() + 300000); // Open for 5 minutes
            this.logger.warn(
              `Circuit breaker OPEN for ${provider.getName()}: ${cb.failures} consecutive failures`,
            );
          }
        } else {
          cb.failures = 0;
          cb.openUntil = null;
        }
        this.circuitBreakers.set(provider.getName(), cb);
      } catch (error) {
        this.logger.error(
          `Health check failed for ${provider.getName()}`,
          {
            error:
              error instanceof Error ? error.message : error,
          },
        );
      }
    }
  }

  isCircuitOpen(providerName: string): boolean {
    const cb = this.circuitBreakers.get(providerName);
    if (!cb?.openUntil) return false;
    if (new Date() > cb.openUntil) {
      cb.openUntil = null;
      cb.failures = 0;
      return false;
    }
    return true;
  }

  async getProviderHealth(
    providerName: string,
  ): Promise<ProviderHealthInfo | null> {
    const cacheKey = `ai:provider:${providerName}:health`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) return JSON.parse(cached) as ProviderHealthInfo;
    return null;
  }

  async getAllHealth(): Promise<Record<string, ProviderHealthInfo>> {
    const providers = this.registry.getAll();
    const result: Record<string, ProviderHealthInfo> = {};
    for (const provider of providers) {
      const health = await this.getProviderHealth(provider.getName());
      if (health) result[provider.getName()] = health;
    }
    return result;
  }
}
