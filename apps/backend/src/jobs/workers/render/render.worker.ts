import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { OutboxService } from '@/libs/outbox/outbox.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ExportService } from '@/modules/render/services/export.service';
import { Render2DService } from '@/modules/render/services/render-2d.service';
import { Render3DService } from '@/modules/render/services/render-3d.service';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

interface RenderJobData {
  renderId: string;
  type: '2d' | '3d' | 'preview' | 'export';
  productId: string;
  designId?: string;
  options: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  userId?: string;
  brandId: string;
  callback?: string;
}

interface RenderProgress {
  stage: string;
  percentage: number;
  message: string;
  timestamp: Date;
}

@Processor('render-processing')
export class RenderWorker {
  private readonly logger = new Logger(RenderWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly render2DService: Render2DService,
    private readonly render3DService: Render3DService,
    private readonly exportService: ExportService,
    private readonly outboxService: OutboxService,
  ) {}

  @Process('render-2d')
  async render2D(job: Job<RenderJobData>) {
    const { renderId, productId, designId, options, priority, brandId, userId } = job.data;
    const startTime = Date.now();

    // Timeout: 60 secondes pour rendu 2D
    const timeout = setTimeout(() => {
      this.logger.error(`2D render timeout for ${renderId} after 60s`);
      job.moveToFailed(new Error('2D render timeout after 60s'), job.token || '');
    }, 60000);

    try {
      this.logger.log(`Starting 2D render for ${renderId}`);

      // Mettre à jour le progrès
      await this.updateRenderProgress(job, {
        stage: 'initialization',
        percentage: 10,
        message: 'Initialisation du rendu 2D',
        timestamp: new Date(),
      });

      // Créer la requête de rendu
      const renderRequest = {
        id: renderId,
        type: '2d' as const,
        productId,
        designId,
        options,
        priority,
      };

      // Exécuter le rendu 2D
      await this.updateRenderProgress(job, {
        stage: 'rendering',
        percentage: 30,
        message: 'Rendu 2D en cours',
        timestamp: new Date(),
      });

      const result = await this.render2DService.render2D(renderRequest);

      // Finaliser le rendu
      await this.updateRenderProgress(job, {
        stage: 'finalization',
        percentage: 90,
        message: 'Finalisation du rendu',
        timestamp: new Date(),
      });

      // Sauvegarder les résultats
      await this.saveRenderResults(renderId, result, '2d');

      // Mettre à jour le progrès final
      await this.updateRenderProgress(job, {
        stage: 'completed',
        percentage: 100,
        message: 'Rendu 2D terminé avec succès',
        timestamp: new Date(),
      });

      const totalTime = Date.now() - startTime;
      this.logger.log(`2D render completed for ${renderId} in ${totalTime}ms`);

      clearTimeout(timeout);

      // Publier événement via Outbox
      await this.outboxService.publish('render.completed', {
        renderId,
        type: '2d',
        brandId,
        userId,
        productId,
        designId,
        result,
        renderTime: totalTime,
        completedAt: new Date(),
      });

      return {
        renderId,
        status: 'success',
        result,
        renderTime: totalTime,
      };

    } catch (error) {
      clearTimeout(timeout);
      this.logger.error(`2D render failed for ${renderId}:`, error);
      
      await this.updateRenderProgress(job, {
        stage: 'error',
        percentage: 0,
        message: `Erreur: ${error.message}`,
        timestamp: new Date(),
      });

      await this.saveRenderError(renderId, error.message);

      // Publier événement d'erreur via Outbox
      await this.outboxService.publish('render.failed', {
        renderId,
        type: '2d',
        brandId,
        userId,
        productId,
        designId,
        error: error.message,
        failedAt: new Date(),
      });

      throw error;
    }
  }

  @Process('render-3d')
  async render3D(job: Job<RenderJobData>) {
    const { renderId, productId, designId, options, priority } = job.data;
    const startTime = Date.now();

    try {
      this.logger.log(`Starting 3D render for ${renderId}`);

      // Mettre à jour le progrès
      await this.updateRenderProgress(job, {
        stage: 'initialization',
        percentage: 10,
        message: 'Initialisation du rendu 3D',
        timestamp: new Date(),
      });

      // Créer la requête de rendu
      const renderRequest = {
        id: renderId,
        type: '3d' as const,
        productId,
        designId,
        options,
        priority,
      };

      // Préparer la scène 3D
      await this.updateRenderProgress(job, {
        stage: 'scene-preparation',
        percentage: 25,
        message: 'Préparation de la scène 3D',
        timestamp: new Date(),
      });

      // Exécuter le rendu 3D
      await this.updateRenderProgress(job, {
        stage: 'rendering',
        percentage: 50,
        message: 'Rendu 3D en cours',
        timestamp: new Date(),
      });

      const result = await this.render3DService.render3D(renderRequest);

      // Post-traitement
      await this.updateRenderProgress(job, {
        stage: 'post-processing',
        percentage: 80,
        message: 'Post-traitement 3D',
        timestamp: new Date(),
      });

      // Sauvegarder les résultats
      await this.saveRenderResults(renderId, result, '3d');

      // Mettre à jour le progrès final
      await this.updateRenderProgress(job, {
        stage: 'completed',
        percentage: 100,
        message: 'Rendu 3D terminé avec succès',
        timestamp: new Date(),
      });

      const totalTime = Date.now() - startTime;
      this.logger.log(`3D render completed for ${renderId} in ${totalTime}ms`);

      return {
        renderId,
        status: 'success',
        result,
        renderTime: totalTime,
      };

    } catch (error) {
      this.logger.error(`3D render failed for ${renderId}:`, error);
      
      await this.updateRenderProgress(job, {
        stage: 'error',
        percentage: 0,
        message: `Erreur: ${error.message}`,
        timestamp: new Date(),
      });

      await this.saveRenderError(renderId, error.message);
      throw error;
    }
  }

  @Process('render-preview')
  async renderPreview(job: Job<RenderJobData>) {
    const { renderId, productId, designId, options, priority } = job.data;
    const startTime = Date.now();

    try {
      this.logger.log(`Starting preview render for ${renderId}`);

      // Optimiser les options pour la prévisualisation
      const previewOptions = {
        ...options,
        quality: 'draft',
        width: Math.min(options.width || 800, 800),
        height: Math.min(options.height || 600, 600),
        antialiasing: false,
        shadows: false,
      };

      // Choisir le type de rendu selon le produit
      const product = await this.getProduct(productId);
      const renderType = product?.model3dUrl ? '3d' : '2d';

      // Créer la requête de rendu (renderType is '2d' | '3d', compatible with RenderRequest.type)
      const renderRequest = {
        id: renderId,
        type: renderType as '2d' | '3d',
        productId,
        designId,
        options: previewOptions,
        priority,
      };

      // Exécuter le rendu
      let result;
      if (renderType === '3d') {
        result = await this.render3DService.render3D(renderRequest);
      } else {
        result = await this.render2DService.render2D(renderRequest);
      }

      // Sauvegarder les résultats
      await this.saveRenderResults(renderId, result, 'preview');

      const totalTime = Date.now() - startTime;
      this.logger.log(`Preview render completed for ${renderId} in ${totalTime}ms`);

      return {
        renderId,
        status: 'success',
        result,
        renderTime: totalTime,
        type: renderType,
      };

    } catch (error) {
      this.logger.error(`Preview render failed for ${renderId}:`, error);
      await this.saveRenderError(renderId, error.message);
      throw error;
    }
  }

  @Process('export-assets')
  async exportAssets(job: Job<RenderJobData>) {
    const { renderId, productId, designId, options, priority } = job.data;
    const startTime = Date.now();

    try {
      this.logger.log(`Starting asset export for ${renderId}`);

      // Mettre à jour le progrès
      await this.updateRenderProgress(job, {
        stage: 'initialization',
        percentage: 10,
        message: 'Initialisation de l\'export',
        timestamp: new Date(),
      });

      // Récupérer les assets à exporter
      const assets = await this.getAssetsToExport(designId, productId);

      // Préparer l'export
      await this.updateRenderProgress(job, {
        stage: 'preparation',
        percentage: 30,
        message: 'Préparation des assets',
        timestamp: new Date(),
      });

      // Exécuter l'export
      await this.updateRenderProgress(job, {
        stage: 'exporting',
        percentage: 60,
        message: 'Export en cours',
        timestamp: new Date(),
      });

      const exportResult = await this.exportService.exportAssets(assets, options);

      // Finaliser l'export
      await this.updateRenderProgress(job, {
        stage: 'finalization',
        percentage: 90,
        message: 'Finalisation de l\'export',
        timestamp: new Date(),
      });

      // Sauvegarder les résultats
      await this.saveExportResults(renderId, exportResult);

      // Mettre à jour le progrès final
      await this.updateRenderProgress(job, {
        stage: 'completed',
        percentage: 100,
        message: 'Export terminé avec succès',
        timestamp: new Date(),
      });

      const totalTime = Date.now() - startTime;
      this.logger.log(`Asset export completed for ${renderId} in ${totalTime}ms`);

      return {
        renderId,
        status: 'success',
        result: exportResult,
        exportTime: totalTime,
      };

    } catch (error) {
      this.logger.error(`Asset export failed for ${renderId}:`, error);
      
      await this.updateRenderProgress(job, {
        stage: 'error',
        percentage: 0,
        message: `Erreur: ${error.message}`,
        timestamp: new Date(),
      });

      await this.saveRenderError(renderId, error.message);
      throw error;
    }
  }

  @Process('batch-render')
  async batchRender(job: Job<{ batchId: string; renders: RenderJobData[] }>) {
    const { batchId, renders } = job.data;
    const startTime = Date.now();

    try {
      this.logger.log(`Starting batch render for ${batchId} with ${renders.length} renders`);

      const results = [];
      let completed = 0;

      // Traiter les rendus en parallèle (limité)
      const concurrency = 3;
      const chunks = this.chunkArray(renders, concurrency);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (renderData: RenderJobData) => {
          try {
            let result;
            
            switch (renderData.type) {
              case '2d':
                result = await this.render2D({ data: renderData } as Job<RenderJobData>);
                break;
              case '3d':
                result = await this.render3D({ data: renderData } as Job<RenderJobData>);
                break;
              case 'preview':
                result = await this.renderPreview({ data: renderData } as Job<RenderJobData>);
                break;
              case 'export':
                result = await this.exportAssets({ data: renderData } as Job<RenderJobData>);
                break;
              default:
                throw new Error(`Unsupported render type: ${renderData.type}`);
            }

            completed++;
            return result;
          } catch (error) {
            this.logger.error(`Batch render failed for ${renderData.renderId}:`, error);
            completed++;
            return {
              renderId: renderData.renderId,
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);

        // Mettre à jour le progrès global
        const progress = (completed / renders.length) * 100;
        await this.updateBatchProgress(batchId, {
          completed,
          total: renders.length,
          percentage: Math.round(progress),
          results,
        });
      }

      const totalTime = Date.now() - startTime;
      this.logger.log(`Batch render completed for ${batchId} in ${totalTime}ms`);

      return {
        batchId,
        status: 'completed',
        results,
        totalTime,
      };

    } catch (error) {
      this.logger.error(`Batch render failed for ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour le progrès du rendu
   */
  private async updateRenderProgress(job: Job, progress: RenderProgress): Promise<void> {
    // Mettre à jour le progrès du job
    await job.updateProgress({
      stage: progress.stage,
      percentage: progress.percentage,
      message: progress.message,
      timestamp: progress.timestamp,
    });

    // Sauvegarder en base
    await this.prisma.renderProgress.upsert({
      where: { renderId: job.data.renderId },
      update: progress,
      create: {
        renderId: job.data.renderId,
        ...progress,
      },
    });
  }

  /**
   * Met à jour le progrès du batch
   */
  private async updateBatchProgress(batchId: string, progress: any): Promise<void> {
    await this.prisma.batchRenderProgress.upsert({
      where: { batchId },
      update: progress,
      create: {
        batchId,
        ...progress,
      },
    });
  }

  /**
   * Sauvegarde les résultats du rendu
   */
  private async saveRenderResults(renderId: string, result: any, type: string): Promise<void> {
    await this.prisma.renderResult.create({
      data: {
        renderId,
        type,
        status: result.status,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        metadata: result.metadata,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Sauvegarde les résultats de l'export
   */
  private async saveExportResults(renderId: string, result: any): Promise<void> {
    await this.prisma.exportResult.create({
      data: {
        renderId,
        format: result.format,
        url: result.url,
        size: result.size,
        metadata: result.metadata,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Sauvegarde les erreurs de rendu
   */
  private async saveRenderError(renderId: string, error: string): Promise<void> {
    await this.prisma.renderError.create({
      data: {
        renderId,
        error,
        occurredAt: new Date(),
      },
    });
  }

  /**
   * Récupère un produit
   */
  private async getProduct(productId: string): Promise<any> {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        model3dUrl: true,
        baseAssetUrl: true,
        images: true,
      },
    });
  }

  /**
   * Récupère les assets à exporter
   */
  private async getAssetsToExport(designId?: string, productId?: string): Promise<any[]> {
    if (designId) {
      return this.prisma.asset.findMany({
        where: { designId },
        select: {
          id: true,
          url: true,
          type: true,
          metadata: true,
        },
      });
    }

    if (productId) {
      const product = await this.getProduct(productId);
      return [{
        id: product.id,
        url: product.baseAssetUrl,
        type: 'image',
        metaJson: { source: 'product' },
      }];
    }

    return [];
  }

  /**
   * Divise un tableau en chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Obtient les métriques de rendu
   */
  async getRenderMetrics(): Promise<any> {
    const cacheKey = 'render_worker_metrics';
    
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Record<string, unknown>;
    }

    try {
      // Statistiques des 24 dernières heures
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const totalRenders = await this.prisma.renderResult.count({
        where: { createdAt: { gte: yesterday } },
      });

      const successfulRenders = await this.prisma.renderResult.count({
        where: {
          status: 'success',
          createdAt: { gte: yesterday },
        },
      });

      const failedRenders = await this.prisma.renderResult.count({
        where: {
          status: 'failed',
          createdAt: { gte: yesterday },
        },
      });

      const rendersByType = await this.prisma.renderResult.groupBy({
        by: ['type'],
        where: { createdAt: { gte: yesterday } },
        _count: { type: true },
      });

      const metrics = {
        totalRenders,
        successfulRenders,
        failedRenders,
        successRate: totalRenders > 0 ? (successfulRenders / totalRenders) * 100 : 0,
        rendersByType: rendersByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        lastUpdated: new Date(),
      };

      // Mettre en cache pour 5 minutes
      await this.cache.setSimple(cacheKey, JSON.stringify(metrics), 300);
      
      return metrics;
    } catch (error) {
      this.logger.error('Error getting render metrics:', error);
      throw error;
    }
  }
}


