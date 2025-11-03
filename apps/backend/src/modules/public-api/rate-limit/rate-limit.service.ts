import { Injectable } from '@nestjs/common';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  requestsPerMonth: number;
}

@Injectable()
export class RateLimitService {
  constructor(private readonly cache: SmartCacheService) {}

  /**
   * Check if request is within rate limit
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);
    const day = Math.floor(now / 86400000);
    const month = Math.floor(now / 2592000000); // Approximate month

    // Check minute rate limit
    const minuteKey = `rate_limit:${identifier}:minute:${minute}`;
    const minuteCount = Number(await this.cache.getSimple(minuteKey)) || 0;
    
    if (minuteCount >= config.requestsPerMinute) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: (minute + 1) * 60000,
      };
    }

    // Check hour rate limit
    const hourKey = `rate_limit:${identifier}:hour:${hour}`;
    const hourCount = Number(await this.cache.getSimple(hourKey)) || 0;
    
    if (hourCount >= config.requestsPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: (hour + 1) * 3600000,
      };
    }

    // Check day rate limit
    const dayKey = `rate_limit:${identifier}:day:${day}`;
    const dayCount = Number(await this.cache.getSimple(dayKey)) || 0;
    
    if (dayCount >= config.requestsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: (day + 1) * 86400000,
      };
    }

    // Check month rate limit
    const monthKey = `rate_limit:${identifier}:month:${month}`;
    const monthCount = Number(await this.cache.getSimple(monthKey)) || 0;
    
    if (monthCount >= config.requestsPerMonth) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: (month + 1) * 2592000000,
      };
    }

    // Increment counters
    await Promise.all([
      this.cache.setSimple(minuteKey, minuteCount + 1, 120), // 2 minutes TTL
      this.cache.setSimple(hourKey, hourCount + 1, 7200), // 2 hours TTL
      this.cache.setSimple(dayKey, dayCount + 1, 172800), // 2 days TTL
      this.cache.setSimple(monthKey, monthCount + 1, 5184000), // 2 months TTL
    ]);

    // Calculate remaining requests (use the most restrictive limit)
    const remaining = Math.min(
      config.requestsPerMinute - minuteCount - 1,
      config.requestsPerHour - hourCount - 1,
      config.requestsPerDay - dayCount - 1,
      config.requestsPerMonth - monthCount - 1,
    );

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetTime: (minute + 1) * 60000, // Reset time for minute limit
    };
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<{
    minute: { used: number; limit: number; remaining: number };
    hour: { used: number; limit: number; remaining: number };
    day: { used: number; limit: number; remaining: number };
    month: { used: number; limit: number; remaining: number };
  }> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);
    const day = Math.floor(now / 86400000);
    const month = Math.floor(now / 2592000000);

    const [minuteCount, hourCount, dayCount, monthCount] = await Promise.all([
      Number(await this.cache.getSimple(`rate_limit:${identifier}:minute:${minute}`)) || 0,
      Number(await this.cache.getSimple(`rate_limit:${identifier}:hour:${hour}`)) || 0,
      Number(await this.cache.getSimple(`rate_limit:${identifier}:day:${day}`)) || 0,
      Number(await this.cache.getSimple(`rate_limit:${identifier}:month:${month}`)) || 0,
    ]);

    return {
      minute: {
        used: minuteCount,
        limit: config.requestsPerMinute,
        remaining: Math.max(0, config.requestsPerMinute - minuteCount),
      },
      hour: {
        used: hourCount,
        limit: config.requestsPerHour,
        remaining: Math.max(0, config.requestsPerHour - hourCount),
      },
      day: {
        used: dayCount,
        limit: config.requestsPerDay,
        remaining: Math.max(0, config.requestsPerDay - dayCount),
      },
      month: {
        used: monthCount,
        limit: config.requestsPerMonth,
        remaining: Math.max(0, config.requestsPerMonth - monthCount),
      },
    };
  }

  /**
   * Reset rate limit for identifier
   */
  async resetRateLimit(identifier: string): Promise<void> {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);
    const day = Math.floor(now / 86400000);
    const month = Math.floor(now / 2592000000);

    await Promise.all([
      this.cache.delSimple(`rate_limit:${identifier}:minute:${minute}`),
      this.cache.delSimple(`rate_limit:${identifier}:hour:${hour}`),
      this.cache.delSimple(`rate_limit:${identifier}:day:${day}`),
      this.cache.delSimple(`rate_limit:${identifier}:month:${month}`),
    ]);
  }

  /**
   * Get default rate limit configuration
   */
  getDefaultConfig(): RateLimitConfig {
    return {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      requestsPerMonth: 100000,
    };
  }

  /**
   * Get rate limit configuration for API key
   */
  getConfigForApiKey(apiKeyConfig: any): RateLimitConfig {
    if (!apiKeyConfig || !apiKeyConfig.rateLimit) {
      return this.getDefaultConfig();
    }

    return {
      requestsPerMinute: apiKeyConfig.rateLimit.requestsPerMinute || 60,
      requestsPerHour: apiKeyConfig.rateLimit.requestsPerHour || 1000,
      requestsPerDay: apiKeyConfig.rateLimit.requestsPerDay || 10000,
      requestsPerMonth: apiKeyConfig.rateLimit.requestsPerMonth || 100000,
    };
  }
}