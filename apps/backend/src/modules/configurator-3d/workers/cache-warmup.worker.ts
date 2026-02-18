/**
 * Configurator 3D - Cache Warmup Worker
 * BullMQ worker for preloading configuration data into cache
 */

import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfiguratorStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

export interface CacheWarmupJobData {
  brandId?: string;
  configurationId?: string;
}

const CACHE_TYPE = 'configurator-3d';
const CACHE_TTL = 3600;

@Processor('configurator-3d-cache')
export class CacheWarmupWorker {
  private readonly logger = new Logger(CacheWarmupWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smartCache: SmartCacheService,
  ) {}

  @Process('warmup')
  async handleWarmup(job: Job<CacheWarmupJobData>): Promise<void> {
    const { brandId, configurationId } = job.data;

    this.logger.log(
      `Running cache warmup${configurationId ? ` for configuration ${configurationId}` : ''}${brandId ? ` for brand ${brandId}` : ''}${!configurationId && !brandId ? ' (all published)' : ''}`,
    );

    try {
      if (configurationId) {
        await this.warmupConfiguration(configurationId);
        return;
      }

      if (brandId) {
        const configs =
          await this.prisma.configurator3DConfiguration.findMany({
            where: {
              brandId,
              status: ConfiguratorStatus.PUBLISHED,
              deletedAt: null,
            },
            select: { id: true },
          });

        for (const config of configs) {
          await this.warmupConfiguration(config.id);
        }

        this.logger.log(
          `Warmed up ${configs.length} configurations for brand ${brandId}`,
        );
        return;
      }

      const allConfigs =
        await this.prisma.configurator3DConfiguration.findMany({
          where: {
            status: ConfiguratorStatus.PUBLISHED,
            deletedAt: null,
          },
          select: { id: true },
        });

      for (const config of allConfigs) {
        await this.warmupConfiguration(config.id);
      }

      this.logger.log(
        `Warmed up ${allConfigs.length} published configurations`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Cache warmup failed: ${errorMsg}`);
      throw error;
    }
  }

  private async warmupConfiguration(configurationId: string): Promise<void> {
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

    this.logger.debug(`Configuration ${configurationId} warmed up in cache`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Cache warmup job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
