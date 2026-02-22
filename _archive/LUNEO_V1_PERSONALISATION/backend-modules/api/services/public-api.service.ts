import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '@/libs/prisma/prisma.service';

const API_KEY_PREFIX = 'luneo_';
const KEY_BYTES = 24;

export interface CreateApiKeyInput {
  brandId: string;
  name: string;
  scopes: string[];
}

export interface ApiKeyResult {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: Date;
}

export interface ValidateApiKeyResult {
  brandId: string;
  scopes: string[];
  keyId: string;
}

export interface ApiUsageStats {
  brandId: string;
  period: { from: Date; to: Date };
  totalRequests: number;
  byScope: Record<string, number>;
  lastUsedAt: Date | null;
}

@Injectable()
export class PublicApiService {
  private readonly logger = new Logger(PublicApiService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate API key with specific scopes. The raw key is returned only once.
   */
  async createApiKey(
    brandId: string,
    name: string,
    scopes: string[],
  ): Promise<ApiKeyResult> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    if (!name?.trim()) {
      throw new BadRequestException('Name is required');
    }
    const normalizedScopes = [...new Set(scopes)].filter(Boolean);
    if (normalizedScopes.length === 0) {
      throw new BadRequestException('At least one scope is required');
    }

    const rawKey = API_KEY_PREFIX + randomBytes(KEY_BYTES).toString('hex');
    const secretHash = this.hashKey(rawKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        brandId,
        name: name.trim(),
        key: secretHash,
        scopes: normalizedScopes,
        permissions: normalizedScopes,
        isActive: true,
      },
    });

    this.logger.log(`API key created for brand ${brandId}: ${apiKey.id}`);
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * Validate API key and return associated brand and scopes.
   */
  async validateApiKey(key: string): Promise<ValidateApiKeyResult> {
    if (!key?.startsWith(API_KEY_PREFIX)) {
      throw new UnauthorizedException('Invalid API key format');
    }
    const hash = this.hashKey(key);

    const apiKey = await this.prisma.apiKey.findFirst({
      where: { key: hash, isActive: true },
      select: { id: true, brandId: true, scopes: true, expiresAt: true },
    });

    if (!apiKey) {
      this.logger.warn('API key validation failed: key not found or inactive');
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      this.logger.warn(`API key ${apiKey.id} expired`);
      throw new UnauthorizedException('API key expired');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      brandId: apiKey.brandId,
      scopes: apiKey.scopes,
      keyId: apiKey.id,
    };
  }

  /**
   * Revoke an API key by id.
   */
  async revokeApiKey(keyId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { id: true, brandId: true },
    });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
    this.logger.log(`API key revoked: ${keyId} (brand: ${apiKey.brandId})`);
  }

  /**
   * Get API usage stats for a brand over a period.
   */
  async getApiUsage(
    brandId: string,
    period: 'day' | 'week' | 'month',
  ): Promise<ApiUsageStats> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const now = new Date();
    let from: Date;
    if (period === 'day') {
      from = new Date(now);
      from.setDate(from.getDate() - 1);
    } else if (period === 'week') {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
    } else {
      from = new Date(now);
      from.setMonth(from.getMonth() - 1);
    }

    const metrics = await this.prisma.usageMetric.findMany({
      where: {
        brandId,
        metric: 'api_calls',
        timestamp: { gte: from, lte: now },
      },
      orderBy: { timestamp: 'desc' },
    });

    const totalRequests = metrics.reduce((sum, m) => sum + m.value, 0);
    const byScope: Record<string, number> = {};
    for (const m of metrics) {
      const scope = (m.metadata as { scope?: string })?.scope ?? 'default';
      byScope[scope] = (byScope[scope] ?? 0) + m.value;
    }

    const keys = await this.prisma.apiKey.findMany({
      where: { brandId, isActive: true },
      select: { lastUsedAt: true },
      orderBy: { lastUsedAt: 'desc' },
      take: 1,
    });
    const lastUsedAt = keys[0]?.lastUsedAt ?? null;

    return {
      brandId,
      period: { from, to: now },
      totalRequests,
      byScope,
      lastUsedAt,
    };
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key, 'utf8').digest('hex');
  }
}
