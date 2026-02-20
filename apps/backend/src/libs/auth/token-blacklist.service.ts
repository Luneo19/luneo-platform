/**
 * SECURITY: Access Token Blacklist Service
 * 
 * Uses Redis to maintain a blacklist of revoked access tokens.
 * When a user logs out or changes password, their access token JTI is blacklisted
 * for the remaining lifetime of the token (max 15 minutes).
 * 
 * This closes the window where a revoked access token could still be used.
 */
import { Injectable, Logger } from '@nestjs/common';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

const BLACKLIST_PREFIX = 'token_blacklist:';
const DEFAULT_TTL_SECONDS = 900; // 15 minutes (matches access token expiry)

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(private readonly redis: RedisOptimizedService) {}

  /**
   * Blacklist an access token by user ID.
   * All tokens issued before this timestamp will be considered revoked.
   * @param userId - The user ID whose tokens should be revoked
   * @param ttlSeconds - How long to keep the blacklist entry (default: 15 min)
   */
  async blacklistUser(userId: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      const key = `${BLACKLIST_PREFIX}${userId}`;
      const revokedAt = Date.now();
      const client = this.redis.client;
      if (client) {
        await client.set(key, revokedAt.toString(), 'EX', ttlSeconds);
        this.logger.log(`Blacklisted tokens for user ${userId} (revokedAt: ${revokedAt})`);
      }
    } catch (error) {
      // Fail-open: if Redis is unavailable, log but don't block the logout
      this.logger.warn(`Failed to blacklist tokens for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a user's tokens issued before a certain time are blacklisted.
   * @param userId - The user ID to check
   * @param tokenIssuedAt - The iat (issued at) timestamp of the token in seconds
   * @returns true if the token is blacklisted (should be rejected)
   */
  async isBlacklisted(userId: string, tokenIssuedAt: number): Promise<boolean> {
    try {
      const client = this.redis.client;
      if (!client) return false; // Fail-open if Redis unavailable

      const key = `${BLACKLIST_PREFIX}${userId}`;
      const revokedAtStr = await client.get(key);
      
      if (!revokedAtStr) return false;

      const revokedAt = parseInt(revokedAtStr, 10);
      // Token is blacklisted if it was issued before the revocation timestamp
      // tokenIssuedAt is in seconds (JWT iat), revokedAt is in milliseconds
      return (tokenIssuedAt * 1000) <= revokedAt;
    } catch (error) {
      // Fail-open: if Redis check fails, allow the token
      this.logger.debug(`Blacklist check skipped for user ${userId} (Redis not ready)`);
      return false;
    }
  }
}
