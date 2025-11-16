import { createHmac, timingSafeEqual } from 'crypto';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

const logger = new Logger('WebhookVerification');

export interface WebhookVerificationOptions {
  /** HMAC secret key */
  secret: string;
  /** Algorithm to use (default: sha256) */
  algorithm?: 'sha256' | 'sha512' | 'sha1';
  /** Timestamp tolerance in seconds (default: 300 = 5 minutes) */
  timestampTolerance?: number;
  /** Nonce expiry in seconds (default: 3600 = 1 hour) */
  nonceExpiry?: number;
  /** Redis client for nonce storage (optional, falls back to in-memory if not provided) */
  redis?: Redis;
}

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
  nonce?: string;
  timestamp?: number;
}

/**
 * Webhook HMAC Verification Utility with Replay Protection
 * 
 * Features:
 * - HMAC signature verification
 * - Timestamp validation (prevents old requests)
 * - Nonce tracking (prevents replay attacks)
 * - Thread-safe nonce storage (Redis-backed)
 */
export class WebhookVerificationUtil {
  private readonly secret: string;
  private readonly algorithm: string;
  private readonly timestampTolerance: number;
  private readonly nonceExpiry: number;
  private readonly redis?: Redis;
  private readonly inMemoryNonces = new Set<string>(); // Fallback if Redis not available

  constructor(options: WebhookVerificationOptions) {
    this.secret = options.secret;
    this.algorithm = options.algorithm || 'sha256';
    this.timestampTolerance = options.timestampTolerance || 300; // 5 minutes
    this.nonceExpiry = options.nonceExpiry || 3600; // 1 hour
    this.redis = options.redis;
  }

  /**
   * Verify webhook signature and check for replay attacks
   * 
   * @param payload Raw request body (string or Buffer)
   * @param signature HMAC signature from header
   * @param nonce Nonce from header (optional but recommended)
   * @param timestamp Timestamp from header (optional but recommended)
   * @returns Verification result
   */
  async verify(
    payload: string | Buffer,
    signature: string,
    nonce?: string,
    timestamp?: number | string,
  ): Promise<WebhookVerificationResult> {
    try {
      // 1. Verify HMAC signature
      const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
      const expectedSignature = this.generateSignature(payloadString);

      if (!this.constantTimeCompare(signature, expectedSignature)) {
        logger.warn('Webhook signature verification failed');
        return {
          valid: false,
          error: 'Invalid signature',
        };
      }

      // 2. Verify timestamp (if provided)
      if (timestamp !== undefined) {
        const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(now - timestampNum);

        if (timeDiff > this.timestampTolerance) {
          logger.warn(`Webhook timestamp out of tolerance. Diff: ${timeDiff}s, Tolerance: ${this.timestampTolerance}s`);
          return {
            valid: false,
            error: `Timestamp out of tolerance. Difference: ${timeDiff}s`,
            timestamp: timestampNum,
          };
        }
      }

      // 3. Verify nonce (if provided) - prevents replay attacks
      if (nonce) {
        const nonceValid = await this.checkAndStoreNonce(nonce);
        if (!nonceValid) {
          logger.warn(`Webhook nonce already used or invalid: ${nonce.substring(0, 8)}...`);
          return {
            valid: false,
            error: 'Nonce already used (replay attack detected)',
            nonce,
          };
        }
      }

      return {
        valid: true,
        nonce,
        timestamp: timestamp ? (typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp) : undefined,
      };
    } catch (error) {
      logger.error('Webhook verification error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Generate HMAC signature for payload
   */
  generateSignature(payload: string): string {
    const hmac = createHmac(this.algorithm, this.secret);
    hmac.update(payload, 'utf8');
    return hmac.digest('hex');
  }

  /**
   * Generate nonce for webhook requests
   */
  generateNonce(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Check if nonce exists and store it (prevents replay)
   */
  private async checkAndStoreNonce(nonce: string): Promise<boolean> {
    if (this.redis) {
      // Use Redis for distributed systems
      const key = `webhook:nonce:${nonce}`;
      const exists = await this.redis.exists(key);
      
      if (exists === 1) {
        return false; // Nonce already used
      }

      // Store nonce with expiry
      await this.redis.setex(key, this.nonceExpiry, '1');
      return true;
    } else {
      // Fallback to in-memory (single instance only)
      if (this.inMemoryNonces.has(nonce)) {
        return false;
      }
      this.inMemoryNonces.add(nonce);
      
      // Clean up after expiry (simple timeout)
      setTimeout(() => {
        this.inMemoryNonces.delete(nonce);
      }, this.nonceExpiry * 1000);
      
      return true;
    }
  }

  /**
   * Constant-time string comparison (prevents timing attacks)
   */
  private constantTimeCompare(a: string, b: string): boolean {
    try {
      const aBuf = Buffer.from(a, 'hex');
      const bBuf = Buffer.from(b, 'hex');
      
      if (aBuf.length !== bBuf.length) {
        return false;
      }
      
      return timingSafeEqual(aBuf, bBuf);
    } catch {
      return false;
    }
  }

  /**
   * Clean up expired nonces (call periodically)
   */
  async cleanupExpiredNonces(): Promise<number> {
    if (!this.redis) {
      // In-memory cleanup is handled by setTimeout
      return 0;
    }

    // Redis handles expiry automatically, but we can scan for old keys
    // This is optional - Redis TTL handles it
    return 0;
  }
}

/**
 * Factory function to create webhook verifier
 */
export function createWebhookVerifier(options: WebhookVerificationOptions): WebhookVerificationUtil {
  return new WebhookVerificationUtil(options);
}
