import { Injectable, Logger } from '@nestjs/common';
import { ConfiguratorStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

const CACHE_TYPE = 'configurator-3d';
const CACHE_TTL = 3600;

@Injectable()
export class Configurator3DCacheService {
  private readonly logger = new Logger(Configurator3DCacheService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smartCache: SmartCacheService,
  ) {}

  async warmupConfiguration(configurationId: string): Promise<void> {
    try {
      const config = await this.prisma.configurator3DConfiguration.findUnique({
        where: {
          id: configurationId,
          status: ConfiguratorStatus.PUBLISHED,
          deletedAt: null,
        },
        include: {
          components: {
            where: { isEnabled: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              options: {
                where: { isEnabled: true, isVisible: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          rules: {
            where: { isEnabled: true },
            orderBy: { priority: 'desc' },
          },
        },
      });

      if (!config) {
        this.logger.warn(
          `Configuration ${configurationId} not found or not published for warmup`,
        );
        return;
      }

      await this.smartCache.set(
        `config:${configurationId}`,
        CACHE_TYPE,
        config,
        {
          ttl: CACHE_TTL,
          tags: [`configurator-3d:${configurationId}`, `brand:${config.brandId}`],
        },
      );

      await this.smartCache.set(
        `config:slug:${config.slug}`,
        CACHE_TYPE,
        config,
        {
          ttl: CACHE_TTL,
          tags: [`configurator-3d:${configurationId}`, `brand:${config.brandId}`],
        },
      );

      this.logger.log(`Configuration ${configurationId} warmed up in cache`);
    } catch (err) {
      this.logger.error(`Failed to warmup configuration ${configurationId}`, err);
    }
  }

  async warmupAllPublished(brandId: string): Promise<number> {
    try {
      const configs = await this.prisma.configurator3DConfiguration.findMany({
        where: {
          brandId,
          status: ConfiguratorStatus.PUBLISHED,
          deletedAt: null,
        },
        select: { id: true },
      });

      let count = 0;
      for (const config of configs) {
        await this.warmupConfiguration(config.id);
        count++;
      }

      this.logger.log(
        `Warmed up ${count} published configurations for brand ${brandId}`,
      );

      return count;
    } catch (err) {
      this.logger.error(`Failed to warmup brand ${brandId}`, err);
      return 0;
    }
  }

  async invalidateConfiguration(configurationId: string): Promise<void> {
    try {
      await this.smartCache.invalidateByTags([
        `configurator-3d:${configurationId}`,
      ]);
      this.logger.log(`Invalidated cache for configuration ${configurationId}`);
    } catch (err) {
      this.logger.error(
        `Failed to invalidate configuration ${configurationId}`,
        err,
      );
    }
  }

  async invalidateBrand(brandId: string): Promise<void> {
    try {
      await this.smartCache.invalidateByTags([
        `brand:${brandId}`,
        'configurator-3d:list',
      ]);
      this.logger.log(`Invalidated cache for brand ${brandId}`);
    } catch (err) {
      this.logger.error(`Failed to invalidate brand ${brandId}`, err);
    }
  }

  async getCacheStats(): Promise<{
    hitRate: number;
    memoryUsage: Record<string, unknown>;
    keyCounts: Record<string, number>;
  }> {
    return this.smartCache.getCacheStats();
  }
}
