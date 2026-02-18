import { Injectable, Logger } from '@nestjs/common';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMCompletionRequest, LLMCompletionResponse } from '../providers/base-llm.provider';
import * as crypto from 'crypto';

@Injectable()
export class LLMCacheService {
  private readonly logger = new Logger(LLMCacheService.name);
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private hits = 0;
  private misses = 0;

  constructor(private readonly cache: SmartCacheService) {}

  async get(request: LLMCompletionRequest): Promise<LLMCompletionResponse | null> {
    if (!this.isCacheable(request)) return null;

    const key = this.buildCacheKey(request);
    try {
      const cached = await this.cache.getOrSet<LLMCompletionResponse | null>(
        key,
        async () => null,
        1, // minimal TTL – we only want to check existence
      );
      if (cached) {
        this.hits++;
        this.logger.debug(`Cache HIT for ${request.model}`);
        return cached;
      }
    } catch {
      // cache miss
    }
    this.misses++;
    return null;
  }

  async set(request: LLMCompletionRequest, response: LLMCompletionResponse): Promise<void> {
    if (!this.isCacheable(request)) return;

    const key = this.buildCacheKey(request);
    try {
      await this.cache.getOrSet(key, async () => response, this.DEFAULT_TTL);
    } catch (error) {
      this.logger.warn(`Failed to cache LLM response: ${error}`);
    }
  }

  getStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  private isCacheable(request: LLMCompletionRequest): boolean {
    if (request.temperature && request.temperature > 0.2) return false;
    if (request.tools?.length) return false;
    return true;
  }

  private buildCacheKey(request: LLMCompletionRequest): string {
    const payload = JSON.stringify({
      model: request.model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });
    const hash = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
    return `llm-cache:${request.model}:${hash}`;
  }
}
