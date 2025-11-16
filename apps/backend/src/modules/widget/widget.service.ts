import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { CustomMetricsService } from '@/modules/observability/custom-metrics.service';
import { randomBytes } from 'crypto';

@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);
  private readonly embedTokenExpiry = 5 * 60; // 5 minutes in seconds
  private readonly nonceExpiry = 10 * 60; // 10 minutes in seconds (longer than token for handshake window)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisOptimizedService,
    @Inject(forwardRef(() => CustomMetricsService))
    private readonly customMetrics?: CustomMetricsService,
  ) {}

  /**
   * Generate embed token for a shop
   * Validates shop installation and creates short-lived JWT with nonce
   */
  async generateEmbedToken(shopDomain: string, origin?: string): Promise<{
    token: string;
    nonce: string;
    expiresIn: number;
  }> {
    const startTime = Date.now();
    try {
      // Validate shop installation
    const installation = await this.prisma.shopifyInstall.findUnique({
      where: { shopDomain },
      include: { brand: true },
    });

    if (!installation || installation.status !== 'active') {
      throw new NotFoundException(`Active Shopify installation not found for shop: ${shopDomain}`);
    }

    // Generate one-time nonce
    const nonce = this.generateNonce();
    
    // Store nonce in Redis with shop mapping (single-use, expires in 10 minutes)
    const nonceKey = `embed:nonce:${nonce}`;
    await this.redisService.set(nonceKey, {
      shopDomain,
      origin: origin || '*',
      createdAt: Date.now(),
      used: false,
    }, 'session', { ttl: this.nonceExpiry });

    // Create JWT payload
    const payload = {
      sub: installation.brandId,
      shop: shopDomain,
      nonce,
      type: 'embed',
      iat: Math.floor(Date.now() / 1000),
    };

    // Sign JWT with 5-minute expiry
    const token = this.jwtService.sign(payload, {
      expiresIn: `${this.embedTokenExpiry}s`,
    });

    this.logger.log(`Generated embed token for shop: ${shopDomain}, nonce: ${nonce.substring(0, 8)}...`);

    const duration = (Date.now() - startTime) / 1000;
    this.customMetrics?.recordEmbedHandshakeSuccess(duration);

    return {
      token,
      nonce,
      expiresIn: this.embedTokenExpiry,
    };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const reason = error instanceof NotFoundException ? 'shop_not_found' : 
                     error instanceof Error ? error.message : 'unknown';
      this.customMetrics?.recordEmbedHandshakeFailure(reason, shopDomain, duration);
      throw error;
    }
  }

  /**
   * Validate nonce and mark as used (prevents replay attacks)
   */
  async validateAndConsumeNonce(nonce: string, origin: string): Promise<{
    shopDomain: string;
    valid: boolean;
  }> {
    const startTime = Date.now();
    const nonceKey = `embed:nonce:${nonce}`;
    let shopDomain = 'unknown';
    
    try {
      const nonceData = await this.redisService.get<{
        shopDomain: string;
        origin: string;
        createdAt: number;
        used: boolean;
      }>(nonceKey, 'session');

      if (!nonceData) {
        const duration = (Date.now() - startTime) / 1000;
        this.customMetrics?.recordEmbedHandshakeFailure('invalid_nonce', 'unknown', duration);
        throw new BadRequestException('Invalid or expired nonce');
      }

      shopDomain = nonceData.shopDomain;

      if (nonceData.used) {
        const duration = (Date.now() - startTime) / 1000;
        this.customMetrics?.recordEmbedHandshakeFailure('nonce_reused', shopDomain, duration);
        throw new BadRequestException('Nonce already used (replay attack prevented)');
      }

      // Verify origin matches (allow wildcard for development)
      if (nonceData.origin !== '*' && nonceData.origin !== origin) {
        const duration = (Date.now() - startTime) / 1000;
        this.customMetrics?.recordEmbedHandshakeFailure('origin_mismatch', shopDomain, duration);
        throw new BadRequestException('Origin mismatch');
      }

    // Mark nonce as used
    await this.redisService.set(nonceKey, {
      ...nonceData,
      used: true,
    }, 'session', { ttl: this.nonceExpiry });

      this.logger.log(`Validated and consumed nonce: ${nonce.substring(0, 8)}... for shop: ${shopDomain}`);

      const duration = (Date.now() - startTime) / 1000;
      this.customMetrics?.recordEmbedHandshakeSuccess(duration);

      return {
        shopDomain,
        valid: true,
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const reason = error instanceof BadRequestException ? 
                     (error.message.includes('replay') ? 'nonce_reused' :
                      error.message.includes('Origin') ? 'origin_mismatch' : 'invalid_nonce') :
                     'unknown';
      this.customMetrics?.recordEmbedHandshakeFailure(reason, shopDomain, duration);
      throw error;
    }
  }

  /**
   * Generate cryptographically secure nonce
   */
  private generateNonce(): string {
    return randomBytes(32).toString('hex');
  }
}
