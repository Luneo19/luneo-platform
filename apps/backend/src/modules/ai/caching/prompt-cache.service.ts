// @ts-nocheck
import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@/libs/prisma/prisma.service';
import * as crypto from 'crypto';

export interface CachedResult {
  promptHash: string;
  resultUrl: string;
  thumbnailUrl?: string;
  provider: string;
  model: string;
  quality?: number;
  source: 'redis' | 'database' | 'miss';
}

@Injectable()
export class PromptCacheService {
  private readonly logger = new Logger(PromptCacheService.name);
  private readonly REDIS_TTL_MS = 3600000; // 1 hour

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  normalizePrompt(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,.-]/g, '')
      .trim();
  }

  hashPrompt(prompt: string): string {
    const normalized = this.normalizePrompt(prompt);
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  async get(
    prompt: string,
    provider?: string,
    model?: string,
  ): Promise<CachedResult | null> {
    const hash = this.hashPrompt(prompt);

    // L1: Redis check
    const redisKey = `ai:cache:prompt:${hash}`;
    try {
      const cached = await this.cacheManager.get<string>(redisKey);
      if (cached) {
        this.logger.debug(
          `Cache HIT (Redis L1) for hash ${hash.substring(0, 8)}`,
        );
        return { ...JSON.parse(cached), source: 'redis' as const };
      }
    } catch (error) {
      this.logger.debug('Redis cache read unavailable', {
        error: error instanceof Error ? error.message : error,
      });
    }

    // L2: PostgreSQL check
    try {
      const dbCached = await this.prisma.aICachedGeneration.findFirst({
        where: {
          promptHash: hash,
          ...(provider ? { provider } : {}),
          ...(model ? { model } : {}),
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastAccessedAt: 'desc' },
      });

      if (dbCached) {
        this.logger.debug(
          `Cache HIT (PostgreSQL L2) for hash ${hash.substring(0, 8)}`,
        );

        // Update access count
        await this.prisma.aICachedGeneration.update({
          where: { id: dbCached.id },
          data: {
            accessCount: { increment: 1 },
            lastAccessedAt: new Date(),
          },
        });

        // Promote to Redis L1
        const result: CachedResult = {
          promptHash: hash,
          resultUrl: dbCached.resultUrl,
          thumbnailUrl: dbCached.thumbnailUrl ?? undefined,
          provider: dbCached.provider,
          model: dbCached.model,
          quality: dbCached.quality ?? undefined,
          source: 'database',
        };

        try {
          await this.cacheManager.set(
            redisKey,
            JSON.stringify(result),
            this.REDIS_TTL_MS,
          );
        } catch {
          // ignore Redis write failure
        }

        return result;
      }
    } catch (error) {
      this.logger.warn('PostgreSQL cache read failed', {
        error: error instanceof Error ? error.message : error,
      });
    }

    return null;
  }

  async set(params: {
    prompt: string;
    resultUrl: string;
    thumbnailUrl?: string;
    provider: string;
    model: string;
    parameters?: Record<string, unknown>;
    width?: number;
    height?: number;
    quality?: number;
    sizeBytes?: number;
  }): Promise<void> {
    const hash = this.hashPrompt(params.prompt);
    const normalized = this.normalizePrompt(params.prompt);
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600000); // 30 days

    // Save to PostgreSQL L2
    try {
      await this.prisma.aICachedGeneration.upsert({
        where: { promptHash: hash },
        update: {
          resultUrl: params.resultUrl,
          thumbnailUrl: params.thumbnailUrl,
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
        create: {
          promptHash: hash,
          prompt: params.prompt,
          normalizedPrompt: normalized,
          provider: params.provider,
          model: params.model,
          parameters: (params.parameters as object) ?? {},
          resultUrl: params.resultUrl,
          thumbnailUrl: params.thumbnailUrl,
          width: params.width,
          height: params.height,
          quality: params.quality,
          sizeBytes: params.sizeBytes,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.warn('PostgreSQL cache write failed', {
        error: error instanceof Error ? error.message : error,
      });
    }

    // Save to Redis L1
    try {
      const redisKey = `ai:cache:prompt:${hash}`;
      await this.cacheManager.set(
        redisKey,
        JSON.stringify({
          promptHash: hash,
          resultUrl: params.resultUrl,
          thumbnailUrl: params.thumbnailUrl,
          provider: params.provider,
          model: params.model,
          quality: params.quality,
        }),
        this.REDIS_TTL_MS,
      );
    } catch (error) {
      this.logger.debug('Redis cache write unavailable', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  async invalidate(prompt: string): Promise<void> {
    const hash = this.hashPrompt(prompt);
    try {
      await this.cacheManager.del(`ai:cache:prompt:${hash}`);
      await this.prisma.aICachedGeneration.deleteMany({
        where: { promptHash: hash },
      });
    } catch (error) {
      this.logger.warn('Cache invalidation failed', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  async cleanup(): Promise<number> {
    try {
      const { count } = await this.prisma.aICachedGeneration.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.log(`Cleaned up ${count} expired cache entries`);
      return count;
    } catch (error) {
      this.logger.error('Cache cleanup failed', {
        error: error instanceof Error ? error.message : error,
      });
      return 0;
    }
  }
}
