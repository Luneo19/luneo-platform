import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
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

    return {
      token,
      nonce,
      expiresIn: this.embedTokenExpiry,
    };
  }

  /**
   * Validate nonce and mark as used (prevents replay attacks)
   */
  async validateAndConsumeNonce(nonce: string, origin: string): Promise<{
    shopDomain: string;
    valid: boolean;
  }> {
    const nonceKey = `embed:nonce:${nonce}`;
    const nonceData = await this.redisService.get<{
      shopDomain: string;
      origin: string;
      createdAt: number;
      used: boolean;
    }>(nonceKey, 'session');

    if (!nonceData) {
      throw new BadRequestException('Invalid or expired nonce');
    }

    if (nonceData.used) {
      throw new BadRequestException('Nonce already used (replay attack prevented)');
    }

    // Verify origin matches (allow wildcard for development)
    if (nonceData.origin !== '*' && nonceData.origin !== origin) {
      throw new BadRequestException('Origin mismatch');
    }

    // Mark nonce as used
    await this.redisService.set(nonceKey, {
      ...nonceData,
      used: true,
    }, 'session', { ttl: this.nonceExpiry });

    this.logger.log(`Validated and consumed nonce: ${nonce.substring(0, 8)}... for shop: ${nonceData.shopDomain}`);

    return {
      shopDomain: nonceData.shopDomain,
      valid: true,
    };
  }

  /**
   * Generate cryptographically secure nonce
   */
  private generateNonce(): string {
    return randomBytes(32).toString('hex');
  }
}
