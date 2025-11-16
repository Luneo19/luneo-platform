import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { randomBytes } from 'crypto';

export interface JwtRotationPlan {
  /** Current JWT secret */
  currentSecret: string;
  /** New JWT secret to rotate to */
  newSecret: string;
  /** Rotation start timestamp */
  rotationStartAt: Date;
  /** Grace period end timestamp (old tokens still valid until this) */
  gracePeriodEndAt: Date;
  /** Full rotation completion timestamp */
  rotationCompleteAt: Date;
}

export interface EmbedKeyRotationResult {
  /** Old key ID (if rotated) */
  oldKeyId?: string;
  /** New key ID */
  newKeyId: string;
  /** New embed token */
  token: string;
  /** Expiry timestamp */
  expiresAt: Date;
}

@Injectable()
export class JwtRotationService {
  private readonly logger = new Logger(JwtRotationService.name);
  private readonly rotationGracePeriodDays = 7; // 7 days grace period for old tokens

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisOptimizedService,
  ) {}

  /**
   * Create a JWT rotation plan
   * This generates a new secret and sets up a rotation schedule
   */
  async createRotationPlan(): Promise<JwtRotationPlan> {
    const currentSecret = this.configService.get<string>('jwt.secret');
    if (!currentSecret) {
      throw new BadRequestException('Current JWT secret not configured');
    }

    // Generate new secret
    const newSecret = this.generateSecret();
    const now = new Date();
    const gracePeriodEndAt = new Date(now.getTime() + this.rotationGracePeriodDays * 24 * 60 * 60 * 1000);
    const rotationCompleteAt = new Date(gracePeriodEndAt.getTime() + 24 * 60 * 60 * 1000); // 1 day after grace period

    const plan: JwtRotationPlan = {
      currentSecret,
      newSecret,
      rotationStartAt: now,
      gracePeriodEndAt,
      rotationCompleteAt,
    };

    // Store rotation plan in Redis (encrypted in production)
    await this.redis.set(
      'jwt:rotation:plan',
      plan,
      'session',
      { ttl: Math.floor((rotationCompleteAt.getTime() - now.getTime()) / 1000) },
    );

    this.logger.log(`JWT rotation plan created. Grace period ends: ${gracePeriodEndAt.toISOString()}`);

    return plan;
  }

  /**
   * Rotate embed key for a specific brand/shop
   * Invalidates old key and generates new one
   */
  async rotateEmbedKey(brandId: string, shopDomain?: string): Promise<EmbedKeyRotationResult> {
    // Find existing embed key if any (check name contains 'embed' or metadata)
    const existingKey = await this.prisma.apiKey.findFirst({
      where: {
        brandId,
        name: { contains: 'embed' },
        isActive: true,
        ...(shopDomain && {
          OR: [
            { name: { contains: shopDomain } },
            // Check metadata if it exists
          ],
        }),
      },
    });

    let oldKeyId: string | undefined;
    if (existingKey) {
      // Revoke old key
      await this.prisma.apiKey.update({
        where: { id: existingKey.id },
        data: {
          isActive: false,
          revokedAt: new Date(),
          metadata: {
            ...(existingKey.metadata as object || {}),
            rotatedAt: new Date().toISOString(),
            rotatedBy: 'system',
          },
        },
      });
      oldKeyId = existingKey.id;

      // Invalidate in Redis cache
      await this.redis.del(`api-key:${existingKey.id}`, 'api');
    }

    // Generate new embed token
    const payload = {
      sub: brandId,
      shop: shopDomain,
      type: 'embed',
      iat: Math.floor(Date.now() / 1000),
    };

    const expiresIn = 5 * 60; // 5 minutes
    const token = this.jwtService.sign(payload, {
      expiresIn: `${expiresIn}s`,
    });

    // Store token metadata in Redis for tracking
    const tokenId = randomBytes(16).toString('hex');
    await this.redis.set(
      `embed:token:${tokenId}`,
      {
        brandId,
        shopDomain,
        createdAt: Date.now(),
        expiresAt: Date.now() + expiresIn * 1000,
      },
      'session',
      { ttl: expiresIn },
    );

    this.logger.log(`Embed key rotated for brand: ${brandId}, shop: ${shopDomain || 'N/A'}`);

    return {
      oldKeyId,
      newKeyId: tokenId,
      token,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * Expire/revoke embed keys for a brand
   */
  async expireEmbedKeys(brandId: string, shopDomain?: string): Promise<number> {
    const where: any = {
      brandId,
      name: { contains: 'embed' },
      isActive: true,
    };

    if (shopDomain) {
      where.OR = [
        { name: { contains: shopDomain } },
      ];
    }

    const keys = await this.prisma.apiKey.findMany({ where });

    if (keys.length === 0) {
      return 0;
    }

    // Revoke all keys
    const result = await this.prisma.apiKey.updateMany({
      where: {
        id: { in: keys.map(k => k.id) },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        metadata: {
          expiredAt: new Date().toISOString(),
          expiredBy: 'system',
        },
      },
    });

    // Invalidate in Redis
    for (const key of keys) {
      await this.redis.del(`api-key:${key.id}`, 'api');
    }

    this.logger.log(`Expired ${result.count} embed keys for brand: ${brandId}`);

    return result.count;
  }

  /**
   * Get current rotation plan status
   */
  async getRotationPlanStatus(): Promise<JwtRotationPlan | null> {
    return await this.redis.get<JwtRotationPlan>('jwt:rotation:plan', 'session');
  }

  /**
   * Complete rotation (remove old secret support)
   * Should only be called after grace period ends
   */
  async completeRotation(): Promise<void> {
    const plan = await this.getRotationPlanStatus();
    if (!plan) {
      throw new NotFoundException('No active rotation plan found');
    }

    const now = new Date();
    if (now < plan.gracePeriodEndAt) {
      throw new BadRequestException(
        `Rotation cannot be completed yet. Grace period ends at ${plan.gracePeriodEndAt.toISOString()}`,
      );
    }

    // In production, update environment variable/secret manager with new secret
    // For now, just log and remove plan
    this.logger.warn(
      `Rotation completion requested. Update JWT_SECRET environment variable to: ${plan.newSecret}`,
    );

    // Remove rotation plan
    await this.redis.del('jwt:rotation:plan', 'session');

    this.logger.log('JWT rotation completed');
  }

  private generateSecret(): string {
    return randomBytes(64).toString('hex');
  }
}
