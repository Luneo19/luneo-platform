/**
 * Mock Rate Limit Service pour les tests d'intégration
 */

import { Injectable } from '@nestjs/common';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: number;
  retryAfter?: number;
}

@Injectable()
export class MockSlidingWindowRateLimitService {
  private counters: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check rate limit - always allows in test mode
   */
  async check(
    key: string,
    config: { limit: number; window: number; keyPrefix?: string; blockDuration?: number },
  ): Promise<RateLimitResult> {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const now = Date.now();
    const windowMs = config.window * 1000;
    const resetTime = now + windowMs;

    let entry = this.counters.get(fullKey);
    
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime };
      this.counters.set(fullKey, entry);
    }

    entry.count++;

    return {
      allowed: entry.count <= config.limit,
      remaining: Math.max(0, config.limit - entry.count),
      limit: config.limit,
      resetTime: entry.resetTime,
      retryAfter: entry.count > config.limit ? Math.ceil((entry.resetTime - now) / 1000) : undefined,
    };
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    this.counters.delete(key);
  }

  /**
   * Get current count for a key
   */
  async getCount(key: string): Promise<number> {
    const entry = this.counters.get(key);
    return entry?.count || 0;
  }

  /**
   * Clear all counters (for testing)
   */
  clear(): void {
    this.counters.clear();
  }
}
