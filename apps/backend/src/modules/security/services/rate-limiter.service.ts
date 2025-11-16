import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Token Bucket Rate Limiter Service
 * Implements leaky bucket algorithm with Redis backend for per-tenant rate limiting
 * 
 * Algorithm:
 * - Each tenant has a bucket with a capacity (max tokens)
 * - Tokens are added at a fixed rate (refill rate)
 * - Requests consume tokens
 * - If bucket is empty, request is rate limited
 */
export interface RateLimitConfig {
  /** Maximum number of tokens in the bucket */
  capacity: number;
  /** Number of tokens to add per refill interval (in seconds) */
  refillRate: number;
  /** Interval in seconds for token refill */
  refillInterval: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until next token available
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly redis: Redis;
  private readonly defaultConfig: RateLimitConfig = {
    capacity: 100,
    refillRate: 10,
    refillInterval: 60, // 10 tokens per 60 seconds = 10 req/min
  };

  // Per-tenant configurations (can be overridden)
  private readonly tenantConfigs = new Map<string, RateLimitConfig>();

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 50,
      keepAlive: 30000,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.redis.on('connect', () => {
      this.logger.log('Rate limiter Redis connected');
    });

    this.redis.on('error', (error: unknown) => {
      this.logger.error(`Rate limiter Redis error: ${error}`);
    });
  }

  /**
   * Set custom rate limit configuration for a tenant
   */
  setTenantConfig(tenantId: string, config: Partial<RateLimitConfig>): void {
    this.tenantConfigs.set(tenantId, {
      ...this.defaultConfig,
      ...config,
    });
  }

  /**
   * Check rate limit for a tenant
   * Uses token bucket algorithm with atomic Redis operations
   */
  async checkRateLimit(
    tenantId: string,
    tokens: number = 1,
    customConfig?: Partial<RateLimitConfig>,
  ): Promise<RateLimitResult> {
    const config = this.getConfig(tenantId, customConfig);
    const key = this.getKey(tenantId);

    try {
      // Use Lua script for atomic operations
      const result = await this.redis.eval(
        this.getTokenBucketScript(),
        1,
        key,
        config.capacity.toString(),
        config.refillRate.toString(),
        config.refillInterval.toString(),
        tokens.toString(),
        Math.floor(Date.now() / 1000).toString(), // current timestamp
      ) as [number, number, number]; // [allowed, remaining, resetAt]

      const [allowed, remaining, resetAt] = result;
      const retryAfter = allowed === 0 ? Math.max(0, resetAt - Math.floor(Date.now() / 1000)) : undefined;

      return {
        allowed: allowed === 1,
        remaining: remaining,
        resetAt: resetAt,
        retryAfter,
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed for tenant ${tenantId}:`, error);
      // Fail open - allow request if Redis fails (can be configured to fail closed)
      return {
        allowed: true,
        remaining: config.capacity,
        resetAt: Math.floor(Date.now() / 1000) + config.refillInterval,
      };
    }
  }

  /**
   * Reset rate limit for a tenant (admin function)
   */
  async resetRateLimit(tenantId: string): Promise<void> {
    const key = this.getKey(tenantId);
    await this.redis.del(key);
    this.logger.log(`Rate limit reset for tenant: ${tenantId}`);
  }

  /**
   * Get current rate limit status for a tenant
   */
  async getRateLimitStatus(tenantId: string): Promise<{
    remaining: number;
    resetAt: number;
    config: RateLimitConfig;
  }> {
    const config = this.getConfig(tenantId);
    const key = this.getKey(tenantId);

    try {
      const result = await this.redis.eval(
        this.getStatusScript(),
        1,
        key,
        config.capacity.toString(),
        config.refillRate.toString(),
        config.refillInterval.toString(),
        Math.floor(Date.now() / 1000).toString(),
      ) as [number, number]; // [remaining, resetAt]

      return {
        remaining: result[0],
        resetAt: result[1],
        config,
      };
    } catch (error) {
      this.logger.error(`Failed to get rate limit status for tenant ${tenantId}:`, error);
      return {
        remaining: config.capacity,
        resetAt: Math.floor(Date.now() / 1000) + config.refillInterval,
        config,
      };
    }
  }

  private getConfig(tenantId: string, customConfig?: Partial<RateLimitConfig>): RateLimitConfig {
    if (customConfig) {
      return { ...this.defaultConfig, ...customConfig };
    }
    return this.tenantConfigs.get(tenantId) || this.defaultConfig;
  }

  private getKey(tenantId: string): string {
    return `rate-limit:tenant:${tenantId}`;
  }

  /**
   * Lua script for token bucket algorithm
   * Returns: [allowed (1/0), remaining tokens, reset timestamp]
   */
  private getTokenBucketScript(): string {
    return `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local refillInterval = tonumber(ARGV[3])
      local tokensRequested = tonumber(ARGV[4])
      local now = tonumber(ARGV[5])
      
      -- Get current bucket state
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local currentTokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      -- Calculate time elapsed since last refill
      local timeElapsed = now - lastRefill
      
      -- Refill tokens based on elapsed time
      if timeElapsed > 0 then
        local tokensToAdd = math.floor((timeElapsed / refillInterval) * refillRate)
        currentTokens = math.min(capacity, currentTokens + tokensToAdd)
        lastRefill = now
      end
      
      -- Check if we have enough tokens
      local allowed = 0
      local remaining = currentTokens
      
      if currentTokens >= tokensRequested then
        allowed = 1
        remaining = currentTokens - tokensRequested
      end
      
      -- Update bucket state
      local resetAt = now + refillInterval
      redis.call('HMSET', key, 'tokens', remaining, 'lastRefill', lastRefill)
      redis.call('EXPIRE', key, refillInterval * 2) -- Expire after 2x refill interval
      
      return {allowed, remaining, resetAt}
    `;
  }

  /**
   * Lua script to get current status without consuming tokens
   */
  private getStatusScript(): string {
    return `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refillRate = tonumber(ARGV[2])
      local refillInterval = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local currentTokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now
      
      local timeElapsed = now - lastRefill
      
      if timeElapsed > 0 then
        local tokensToAdd = math.floor((timeElapsed / refillInterval) * refillRate)
        currentTokens = math.min(capacity, currentTokens + tokensToAdd)
      end
      
      local resetAt = now + refillInterval
      
      return {currentTokens, resetAt}
    `;
  }
}
