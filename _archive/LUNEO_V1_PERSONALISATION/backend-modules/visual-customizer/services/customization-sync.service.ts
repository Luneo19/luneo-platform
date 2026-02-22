import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

const CACHE_TYPE = 'customizer';
const CACHE_TTL_SECONDS = 3600; // 1 hour for published config

/** Published config shape for widget consumption (subset of VisualCustomizer) */
export interface PublishedCustomizerConfig {
  id: string;
  name: string;
  slug: string;
  status: string;
  canvasConfig: unknown;
  canvasWidth: number;
  canvasHeight: number;
  canvasUnit: string;
  canvasDPI: number;
  backgroundColor: string | null;
  backgroundImageUrl: string | null;
  productImageUrl: string | null;
  productMaskUrl: string | null;
  thumbnailUrl: string | null;
  toolSettings: unknown;
  textSettings: unknown;
  imageSettings: unknown;
  uiConfig: unknown;
  pricingEnabled: boolean;
  basePrice: number;
  currency: string;
  pricePerText: number;
  pricePerImage: number;
  pricePerColor: number;
  version: number;
  publishedAt: string | null;
  zones?: unknown[];
  views?: unknown[];
  layers?: unknown[];
  presets?: unknown[];
}

@Injectable()
export class CustomizationSyncService {
  private readonly logger = new Logger(CustomizationSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Publishes the customizer config: sets publishedAt, increments version, caches in Redis.
   */
  async publishConfig(customizerId: string): Promise<{ version: number; publishedAt: Date }> {
    const customizer = await this.prisma.visualCustomizer.findFirst({
      where: { id: customizerId, deletedAt: null },
      include: {
        zones: { orderBy: { sortOrder: 'asc' } },
        views: { orderBy: { sortOrder: 'asc' } },
        layers: true,
        presets: true,
      },
    });

    if (!customizer) {
      throw new NotFoundException(`Customizer ${customizerId} not found`);
    }

    const now = new Date();
    const newVersion = (customizer.version ?? 1) + 1;

    await this.prisma.visualCustomizer.update({
      where: { id: customizerId },
      data: {
        publishedAt: now,
        version: newVersion,
        status: 'PUBLISHED',
      },
    });

    const config = this.toPublishedConfig(customizer, newVersion, now);
    const cacheKey = customizerId;
    await this.cache.set(cacheKey, CACHE_TYPE, config, {
      ttl: CACHE_TTL_SECONDS,
    });

    this.logger.log(
      `Published customizer ${customizerId} version ${newVersion} at ${now.toISOString()}`,
    );

    return { version: newVersion, publishedAt: now };
  }

  /**
   * Returns the published config for widget consumption. Checks Redis cache first.
   */
  async getPublishedConfig(customizerId: string): Promise<PublishedCustomizerConfig | null> {
    const cacheKey = customizerId;
    const cached = await this.cache.get<PublishedCustomizerConfig | null>(
      cacheKey,
      CACHE_TYPE,
      async (): Promise<PublishedCustomizerConfig | null> =>
        this.fetchPublishedConfigFromDb(customizerId),
      { ttl: CACHE_TTL_SECONDS },
    );
    return cached ?? null;
  }

  /**
   * Invalidates Redis cache for the given customizer.
   */
  async invalidateCache(customizerId: string): Promise<void> {
    try {
      await this.cache.invalidate(customizerId, CACHE_TYPE);
      this.logger.debug(`Invalidated cache for customizer ${customizerId}`);
    } catch (err) {
      this.logger.warn(
        `Failed to invalidate cache for customizer ${customizerId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Returns the current config version number for the customizer.
   */
  async getConfigVersion(customizerId: string): Promise<number> {
    const customizer = await this.prisma.visualCustomizer.findFirst({
      where: { id: customizerId, deletedAt: null },
      select: { version: true },
    });

    if (!customizer) {
      throw new NotFoundException(`Customizer ${customizerId} not found`);
    }

    return customizer.version ?? 1;
  }

  private async fetchPublishedConfigFromDb(
    customizerId: string,
  ): Promise<PublishedCustomizerConfig | null> {
    const customizer = await this.prisma.visualCustomizer.findFirst({
      where: {
        id: customizerId,
        deletedAt: null,
        status: 'PUBLISHED',
      },
      include: {
        zones: { orderBy: { sortOrder: 'asc' } },
        views: { orderBy: { sortOrder: 'asc' } },
        layers: true,
        presets: true,
      },
    });

    if (!customizer) {
      return null;
    }

    return this.toPublishedConfig(
      customizer,
      customizer.version ?? 1,
      customizer.publishedAt ?? undefined,
    );
  }

  private toPublishedConfig(
    row: {
      id: string;
      name: string;
      slug: string;
      status: string;
      canvasConfig: unknown;
      canvasWidth: number;
      canvasHeight: number;
      canvasUnit: string;
      canvasDPI: number;
      backgroundColor: string | null;
      backgroundImageUrl: string | null;
      productImageUrl: string | null;
      productMaskUrl: string | null;
      thumbnailUrl: string | null;
      toolSettings: unknown;
      textSettings: unknown;
      imageSettings: unknown;
      uiConfig: unknown;
      pricingEnabled: boolean;
      basePrice: number;
      currency: string;
      pricePerText: number;
      pricePerImage: number;
      pricePerColor: number;
      publishedAt: Date | null;
      zones?: unknown[];
      views?: unknown[];
      layers?: unknown[];
      presets?: unknown[];
    },
    version: number,
    publishedAt?: Date,
  ): PublishedCustomizerConfig {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      canvasConfig: row.canvasConfig,
      canvasWidth: row.canvasWidth,
      canvasHeight: row.canvasHeight,
      canvasUnit: row.canvasUnit,
      canvasDPI: row.canvasDPI,
      backgroundColor: row.backgroundColor,
      backgroundImageUrl: row.backgroundImageUrl,
      productImageUrl: row.productImageUrl,
      productMaskUrl: row.productMaskUrl,
      thumbnailUrl: row.thumbnailUrl,
      toolSettings: row.toolSettings,
      textSettings: row.textSettings,
      imageSettings: row.imageSettings,
      uiConfig: row.uiConfig,
      pricingEnabled: row.pricingEnabled,
      basePrice: row.basePrice,
      currency: row.currency,
      pricePerText: row.pricePerText,
      pricePerImage: row.pricePerImage,
      pricePerColor: row.pricePerColor,
      version,
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
      zones: row.zones,
      views: row.views,
      layers: row.layers,
      presets: row.presets,
    };
  }
}
