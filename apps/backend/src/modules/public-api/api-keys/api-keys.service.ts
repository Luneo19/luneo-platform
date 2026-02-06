import { JsonValue } from '@/common/types/utility-types';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  brandId: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface CreateApiKeyDto {
  name: string;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
}

export interface UpdateApiKeyDto {
  name?: string;
  permissions?: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
}

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Safely converts Prisma Json rateLimit to ApiKey rateLimit type
   */
  private parseRateLimit(rateLimit: JsonValue | null): ApiKey['rateLimit'] {
    if (!rateLimit || typeof rateLimit !== 'object' || Array.isArray(rateLimit)) {
      return {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
        requestsPerMonth: 300000,
      };
    }
    const rl = rateLimit as Record<string, JsonValue>;
    return {
      requestsPerMinute: typeof rl.requestsPerMinute === 'number' ? rl.requestsPerMinute : 60,
      requestsPerDay: typeof rl.requestsPerDay === 'number' ? rl.requestsPerDay : 10000,
      requestsPerMonth: typeof rl.requestsPerMonth === 'number' ? rl.requestsPerMonth : 300000,
    };
  }

  /**
   * Créer une nouvelle API Key
   */
  async createApiKey(brandId: string, data: CreateApiKeyDto): Promise<{ apiKey: ApiKey; secret: string }> {
    const keyId = `luneo_${this.generateKeyId()}`;
    const secret = this.generateSecret();
    const hashedSecret = await bcrypt.hash(secret, 13);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        id: keyId,
        name: data.name,
        key: keyId,
        secret: hashedSecret,
        permissions: data.permissions,
        rateLimit: data.rateLimit,
        brandId,
        isActive: true,
      },
      include: {
        brand: {
          select: { id: true, name: true }
        }
      }
    });

    // Invalider le cache des API keys
    await this.cache.invalidate(`api-keys:${brandId}`, 'api');

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.id,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit as ApiKey['rateLimit'],
        brandId: apiKey.brandId,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
      secret,
    };
  }

  /**
   * Valider une API Key
   */
  async validateApiKey(key: string, secret?: string): Promise<ApiKey> {
    const cacheKey = `api-key:${key}`;
    
    // Essayer de récupérer depuis le cache
    let apiKey = await this.cache.get(
      cacheKey,
      'api',
      async () => {
        const keyData = await this.prisma.apiKey.findUnique({
          where: { id: key, isActive: true },
          include: {
            brand: {
              select: { id: true, name: true, status: true }
            }
          }
        });

        if (!keyData) {
          throw new UnauthorizedException('Invalid API key');
        }

        // Vérifier que la brand est active
        if (keyData.brand.status !== 'ACTIVE') {
          throw new UnauthorizedException('Brand is not active');
        }

        return {
          id: keyData.id,
          name: keyData.name,
          permissions: keyData.permissions,
          rateLimit: this.parseRateLimit(keyData.rateLimit),
          brandId: keyData.brandId,
          isActive: keyData.isActive,
          createdAt: keyData.createdAt,
          lastUsedAt: keyData.lastUsedAt,
        };
      },
      { ttl: 3600 } // Cache 1 heure
    );

    // Vérifier le secret si fourni
    if (secret) {
      const keyData = await this.prisma.apiKey.findUnique({
        where: { id: key },
        select: { secret: true }
      });

      if (!keyData || !await bcrypt.compare(secret, keyData.secret)) {
        throw new UnauthorizedException('Invalid API key secret');
      }
    }

    // Mettre à jour lastUsedAt
    await this.updateLastUsed(key);

    return {
      ...apiKey,
      key: apiKey.id, // Add the missing key field
    };
  }

  /**
   * Get API key by ID
   */
  async getApiKey(id: string, brandId: string): Promise<ApiKey> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, brandId },
      include: {
        brand: {
          select: { id: true, name: true }
        }
      }
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.id,
      permissions: apiKey.permissions,
      rateLimit: this.parseRateLimit(apiKey.rateLimit),
      brandId: apiKey.brandId,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
    };
  }

  /**
   * Update API key
   */
  async updateApiKey(id: string, brandId: string, data: UpdateApiKeyDto): Promise<ApiKey> {
    const updatedKey = await this.prisma.apiKey.update({
      where: { id, brandId },
      data: {
        name: data.name,
        permissions: data.permissions,
        rateLimit: data.rateLimit,
      },
      include: {
        brand: {
          select: { id: true, name: true }
        }
      }
    });

    return {
      id: updatedKey.id,
      name: updatedKey.name,
      key: updatedKey.id,
      permissions: updatedKey.permissions,
      rateLimit: this.parseRateLimit(updatedKey.rateLimit),
      brandId: updatedKey.brandId,
      isActive: updatedKey.isActive,
      createdAt: updatedKey.createdAt,
      lastUsedAt: updatedKey.lastUsedAt,
    };
  }

  /**
   * Delete API key
   */
  async deleteApiKey(id: string, brandId: string): Promise<void> {
    await this.prisma.apiKey.delete({
      where: { id, brandId },
    });
  }

  /**
   * Regenerate API key secret
   */
  async regenerateSecret(id: string, brandId: string): Promise<{ secret: string }> {
    const secret = this.generateSecret();
    const hashedSecret = await bcrypt.hash(secret, 13);

    await this.prisma.apiKey.update({
      where: { id, brandId },
      data: { secret: hashedSecret },
    });

    return { secret };
  }

  /**
   * Lister les API Keys d'une brand
   */
  async listApiKeys(brandId: string): Promise<ApiKey[]> {
    return this.cache.get(
      `api-keys:${brandId}`,
      'api',
      async () => {
        const apiKeys = await this.prisma.apiKey.findMany({
          where: { brandId, isActive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            permissions: true,
            rateLimit: true,
            brandId: true,
            isActive: true,
            createdAt: true,
            lastUsedAt: true,
          }
        });

        return apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          key: key.id,
          permissions: key.permissions,
          rateLimit: this.parseRateLimit(key.rateLimit),
          brandId: key.brandId,
          isActive: key.isActive,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
        }));
      },
      { ttl: 1800 } // Cache 30 minutes
    );
  }


  /**
   * Désactiver une API Key
   */
  async deactivateApiKey(keyId: string, brandId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, brandId }
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false }
    });

    // Invalider le cache
    await this.cache.invalidate(`api-key:${keyId}`, 'api');
    await this.cache.invalidate(`api-keys:${brandId}`, 'api');
  }

  /**
   * Vérifier les permissions d'une API Key
   */
  async checkPermission(keyId: string, permission: string): Promise<boolean> {
    const apiKey = await this.validateApiKey(keyId);
    return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
  }

  /**
   * Obtenir les statistiques d'utilisation d'une API Key
   */
  async getUsageStats(keyId: string, period: 'day' | 'week' | 'month' = 'day') {
    const cacheKey = `api-key-stats:${keyId}:${period}`;
    
    return this.cache.get(
      cacheKey,
      'analytics',
      async () => {
        // Implémentation des statistiques d'utilisation
        // À compléter selon les besoins de monitoring
        return {
          requests: 0,
          errors: 0,
          rateLimitHits: 0,
          period,
        };
      },
      { ttl: 300 } // Cache 5 minutes
    );
  }

  /**
   * Générer un ID de clé unique
   */
  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${timestamp}_${random}`;
  }

  /**
   * Générer un secret sécurisé
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Mettre à jour la dernière utilisation
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    // Mettre à jour en arrière-plan pour ne pas bloquer la requête
    setImmediate(async () => {
      try {
        await this.prisma.apiKey.update({
          where: { id: keyId },
          data: { lastUsedAt: new Date() }
        });
      } catch (error) {
        this.logger.error('Failed to update last used timestamp:', error);
      }
    });
  }
}
