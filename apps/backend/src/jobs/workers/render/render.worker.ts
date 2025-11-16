import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { JobNames } from '@/jobs/job.constants';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Render2DService } from '@/modules/render/services/render-2d.service';
import { Render3DService } from '@/modules/render/services/render-3d.service';
import { ExportService } from '@/modules/render/services/export.service';
import { traceJob, withActiveSpan } from '@/common/observability/span-helpers';
import {
  RenderJobData,
  BatchRenderJobPayload,
  RenderProgressPayload,
  RenderQueuePayload,
} from '@/modules/render/interfaces/render-job.interface';
import {
  RenderRequest,
  RenderResult,
  RenderQueueResult,
  ExportResult,
  ExportJobData,
  RenderOptions,
  ExportSettings,
} from '@/modules/render/interfaces/render.interface';

@Processor(QueueNames.RENDER_PROCESSING)
export class RenderWorker extends WorkerHost {
  private readonly logger = new Logger(RenderWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly render2DService: Render2DService,
    private readonly render3DService: Render3DService,
    private readonly exportService: ExportService,
  ) {
    super();
  }

  async process(job: Job<RenderQueuePayload>): Promise<unknown> {
    switch (job.name) {
      case JobNames.RENDER.RENDER_3D:
        return this.render3D(job as Job<RenderJobData>);
      case JobNames.RENDER.RENDER_PREVIEW:
        return this.renderPreview(job as Job<RenderJobData>);
      case JobNames.RENDER.EXPORT_ASSETS:
        return this.exportAssets(job as Job<RenderJobData>);
      case JobNames.RENDER.BATCH_RENDER:
        return this.batchRender(job as Job<BatchRenderJobPayload>);
      case JobNames.RENDER.RENDER_2D:
      default:
        return this.render2D(job as Job<RenderJobData>);
    }
  }

  async render2D(job: Job<RenderJobData>) {
    return traceJob('render.worker.render2d', job, async (span) => {
      const { renderId, productId, designId, options, priority } = job.data;
      const renderOptions = options as RenderOptions;
      const startTime = Date.now();

      span.setAttribute('render.mode', '2d');
      span.setAttribute('render.priority', priority ?? 'standard');

      try {
        this.logger.log(`Starting 2D render for ${renderId}`);
        span.addEvent('render.stage', { stage: 'initialization', renderId });

        await this.updateRenderProgress(
          job,
          {
            stage: 'initialization',
            percentage: 10,
            message: 'Initialisation du rendu 2D',
            timestamp: new Date(),
          },
          renderId,
        );

        const renderRequest: RenderRequest = {
          id: renderId,
          type: '2d' as const,
          productId,
          designId,
          options: renderOptions,
          priority,
        };

        span.addEvent('render.stage', { stage: 'rendering', renderId });
        await this.updateRenderProgress(
          job,
          {
            stage: 'rendering',
            percentage: 30,
            message: 'Rendu 2D en cours',
            timestamp: new Date(),
          },
          renderId,
        );

        const result = await withActiveSpan(
          'render.worker.render2d.execute',
          {
            'render.request.type': '2d',
          },
          async () => this.render2DService.render2D(renderRequest),
        );

        span.addEvent('render.stage', { stage: 'finalization', renderId });
        await this.updateRenderProgress(
          job,
          {
            stage: 'finalization',
            percentage: 90,
            message: 'Finalisation du rendu',
            timestamp: new Date(),
          },
          renderId,
        );

        await withActiveSpan(
          'render.worker.render2d.persist',
          { 'render.result.type': '2d' },
          async () => this.saveRenderResults(renderId, result, '2d'),
        );

        await this.updateRenderProgress(
          job,
          {
            stage: 'completed',
            percentage: 100,
            message: 'Rendu 2D terminé avec succès',
            timestamp: new Date(),
          },
          renderId,
        );

        const totalTime = Date.now() - startTime;
        span.setAttribute('render.duration_ms', totalTime);
        this.logger.log(`2D render completed for ${renderId} in ${totalTime}ms`);

        return {
          renderId,
          status: 'success',
          result,
          renderTime: totalTime,
        };
      } catch (error: any) {
        this.logger.error(`2D render failed for ${renderId}:`, error);
        span.addEvent('render.error', { message: error?.message ?? 'unknown' });

        await this.updateRenderProgress(
          job,
          {
            stage: 'error',
            percentage: 0,
            message: `Erreur: ${error.message}`,
            timestamp: new Date(),
          },
          renderId,
        );

        await this.saveRenderError(renderId, error.message);
        throw error;
      }
    });
  }

  async render3D(job: Job<RenderJobData>) {
    return traceJob('render.worker.render3d', job, async (span) => {
      const { renderId, productId, designId, options, priority } = job.data;
      const renderOptions = options as RenderOptions;
      const startTime = Date.now();

      span.setAttribute('render.mode', '3d');
      span.setAttribute('render.priority', priority ?? 'standard');

      try {
        this.logger.log(`Starting 3D render for ${renderId}`);
        span.addEvent('render.stage', { stage: 'initialization', renderId });

        await this.updateRenderProgress(
          job,
          {
            stage: 'initialization',
            percentage: 10,
            message: 'Initialisation du rendu 3D',
            timestamp: new Date(),
          },
          renderId,
        );

        const renderRequest: RenderRequest = {
          id: renderId,
          type: '3d' as const,
          productId,
          designId,
          options: renderOptions,
          priority,
        };

        span.addEvent('render.stage', { stage: 'scene-preparation', renderId });
        await this.updateRenderProgress(
          job,
          {
            stage: 'scene-preparation',
            percentage: 25,
            message: 'Préparation de la scène 3D',
            timestamp: new Date(),
          },
          renderId,
        );

        span.addEvent('render.stage', { stage: 'rendering', renderId });
        await this.updateRenderProgress(
          job,
          {
            stage: 'rendering',
            percentage: 50,
            message: 'Rendu 3D en cours',
            timestamp: new Date(),
          },
          renderId,
        );

        const result = await withActiveSpan(
          'render.worker.render3d.execute',
          { 'render.request.type': '3d' },
          async () => this.render3DService.render3D(renderRequest),
        );

        span.addEvent('render.stage', { stage: 'post-processing', renderId });
        await this.updateRenderProgress(
          job,
          {
            stage: 'post-processing',
            percentage: 80,
            message: 'Post-traitement 3D',
            timestamp: new Date(),
          },
          renderId,
        );

        await withActiveSpan(
          'render.worker.render3d.persist',
          { 'render.result.type': '3d' },
          async () => this.saveRenderResults(renderId, result, '3d'),
        );

        await this.updateRenderProgress(
          job,
          {
            stage: 'completed',
            percentage: 100,
            message: 'Rendu 3D terminé avec succès',
            timestamp: new Date(),
          },
          renderId,
        );

        const totalTime = Date.now() - startTime;
        span.setAttribute('render.duration_ms', totalTime);
        this.logger.log(`3D render completed for ${renderId} in ${totalTime}ms`);

        return {
          renderId,
          status: 'success',
          result,
          renderTime: totalTime,
        };
      } catch (error: any) {
        this.logger.error(`3D render failed for ${renderId}:`, error);
        span.addEvent('render.error', { message: error?.message ?? 'unknown' });

        await this.updateRenderProgress(
          job,
          {
            stage: 'error',
            percentage: 0,
            message: `Erreur: ${error.message}`,
            timestamp: new Date(),
          },
          renderId,
        );

        await this.saveRenderError(renderId, error.message);
        throw error;
      }
    });
  }

  async renderPreview(job: Job<RenderJobData>) {
    return traceJob('render.worker.renderPreview', job, async (span) => {
      const { renderId, productId, designId, options, priority } = job.data;
      const baseOptions = options as RenderOptions;
      const startTime = Date.now();

      span.setAttribute('render.mode', 'preview');
      span.setAttribute('render.priority', priority ?? 'standard');

      try {
        this.logger.log(`Starting preview render for ${renderId}`);

        const previewOptions: RenderOptions = {
          ...baseOptions,
          quality: 'draft',
          width: Math.min(baseOptions.width ?? 800, 800),
          height: Math.min(baseOptions.height ?? 600, 600),
          antialiasing: false,
          shadows: false,
        };

        const product = await withActiveSpan(
          'render.worker.preview.fetch-product',
          { 'luneo.product.id': productId },
          async () => this.getProduct(productId),
        );
        const renderType = product?.model3dUrl ? '3d' : '2d';
        span.setAttribute('render.preview.type', renderType);

        const renderRequest: RenderRequest = {
          id: renderId,
          type: renderType as any,
          productId,
          designId,
          options: previewOptions,
          priority,
        };

        const result = await withActiveSpan(
          'render.worker.preview.execute',
          { 'render.request.type': renderType },
          async () =>
            renderType === '3d'
              ? this.render3DService.render3D(renderRequest)
              : this.render2DService.render2D(renderRequest),
        );

        await withActiveSpan(
          'render.worker.preview.persist',
          { 'render.result.type': renderType },
          async () => this.saveRenderResults(renderId, result, 'preview'),
        );

        const totalTime = Date.now() - startTime;
        span.setAttribute('render.duration_ms', totalTime);
        this.logger.log(`Preview render completed for ${renderId} in ${totalTime}ms`);

        return {
          renderId,
          status: 'success',
          result,
          renderTime: totalTime,
          type: renderType,
        };
      } catch (error: any) {
        this.logger.error(`Preview render failed for ${renderId}:`, error);
        span.addEvent('render.error', { message: error?.message ?? 'unknown' });
        await this.saveRenderError(renderId, error.message);
        throw error;
      }
    });
  }

  async exportAssets(job: Job<RenderJobData>) {
    return traceJob('render.worker.exportAssets', job, async (span) => {
      const { renderId, productId, designId, options, priority } = job.data;
      const exportOptions = options as ExportSettings;
      const startTime = Date.now();

      span.setAttribute('render.mode', 'export');
      span.setAttribute('render.priority', priority ?? 'standard');

      try {
        this.logger.log(`Starting asset export for ${renderId}`);

        span.addEvent('render.stage', { stage: 'initialization', renderId });
        await this.updateRenderProgress(
          job,
          {
            stage: 'initialization',
            percentage: 10,
            message: "Initialisation de l'export",
            timestamp: new Date(),
          },
          renderId,
        );

        const assets = await withActiveSpan(
          'render.worker.export.fetch-assets',
          {
            'luneo.design.id': designId,
            'luneo.product.id': productId,
          },
          async () => this.getAssetsToExport(designId, productId),
        );
        span.setAttribute('render.export.asset_count', assets.length ?? 0);

        await this.updateRenderProgress(
          job,
          {
            stage: 'preparation',
            percentage: 30,
            message: 'Préparation des assets',
            timestamp: new Date(),
          },
          renderId,
        );

        span.addEvent('render.stage', { stage: 'exporting', renderId });
        await this.updateRenderProgress(
          job,
          {
            stage: 'exporting',
            percentage: 60,
            message: 'Export en cours',
            timestamp: new Date(),
          },
          renderId,
        );

        const exportResult = await withActiveSpan(
          'render.worker.export.execute',
          { 'render.export.count': assets.length ?? 0 },
          async () => this.exportService.exportAssets(assets, exportOptions),
        );

        await this.updateRenderProgress(
          job,
          {
            stage: 'finalization',
            percentage: 90,
            message: "Finalisation de l'export",
            timestamp: new Date(),
          },
          renderId,
        );

        await withActiveSpan(
          'render.worker.export.persist',
          {},
          async () => this.saveExportResults(renderId, exportResult),
        );

        await this.updateRenderProgress(
          job,
          {
            stage: 'completed',
            percentage: 100,
            message: 'Export terminé avec succès',
            timestamp: new Date(),
          },
          renderId,
        );

        const totalTime = Date.now() - startTime;
        span.setAttribute('render.duration_ms', totalTime);
        this.logger.log(`Asset export completed for ${renderId} in ${totalTime}ms`);

        return {
          renderId,
          status: 'success',
          result: exportResult,
          exportTime: totalTime,
        };
      } catch (error: any) {
        this.logger.error(`Asset export failed for ${renderId}:`, error);
        span.addEvent('render.error', { message: error?.message ?? 'unknown' });

        await this.updateRenderProgress(
          job,
          {
            stage: 'error',
            percentage: 0,
            message: `Erreur: ${error.message}`,
            timestamp: new Date(),
          },
          renderId,
        );

        await this.saveRenderError(renderId, error.message);
        throw error;
      }
    });
  }

  async batchRender(job: Job<BatchRenderJobPayload>) {
    return traceJob('render.worker.batchRender', job, async (span) => {
      const { batchId, renders } = job.data;
      const startTime = Date.now();
      span.setAttribute('render.batch.size', renders.length);

      try {
        this.logger.log(`Starting batch render for ${batchId} with ${renders.length} renders`);

        const results: unknown[] = [];
        let completed = 0;
        const concurrency = 3;
        const chunks = this.chunkArray(renders, concurrency);

        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.map(async (renderData) => {
              try {
                let result;
                switch (renderData.type) {
                  case '2d':
                    result = await this.render2D({ ...job, data: renderData } as Job<RenderJobData>);
                    break;
                  case '3d':
                    result = await this.render3D({ ...job, data: renderData } as Job<RenderJobData>);
                    break;
                  case 'preview':
                    result = await this.renderPreview({ ...job, data: renderData } as Job<RenderJobData>);
                    break;
                  case 'export':
                    result = await this.exportAssets({ ...job, data: renderData } as Job<RenderJobData>);
                    break;
                  default:
                    throw new Error(`Unsupported render type: ${renderData.type}`);
                }

                completed++;
                return {
                  renderId: renderData.renderId,
                  status: 'success',
                  result,
                };
              } catch (error: any) {
                this.logger.error(`Batch render failed for ${renderData.renderId}:`, error);
                completed++;
                return {
                  renderId: renderData.renderId,
                  status: 'failed',
                  error: error.message,
                };
              }
            }),
          );

          results.push(...chunkResults);

          const progress = (completed / renders.length) * 100;
          await withActiveSpan(
            'render.worker.batch.progress',
            { completed, total: renders.length, percentage: progress },
            async () =>
              this.updateBatchProgress(batchId, {
                completed,
                total: renders.length,
                percentage: Math.round(progress),
                results,
              }),
          );
        }

        const totalTime = Date.now() - startTime;
        span.setAttribute('render.duration_ms', totalTime);
        span.setAttribute('render.batch.completed', completed);
        this.logger.log(`Batch render completed for ${batchId} in ${totalTime}ms`);

        return {
          batchId,
          status: 'completed',
          results,
          totalTime,
        };
      } catch (error) {
        this.logger.error(`Batch render failed for ${batchId}:`, error);
        span.addEvent('render.error', { message: (error as any)?.message ?? 'unknown' });
        throw error;
      }
    });
  }

  /**
   * Met à jour le progrès du rendu
   */
  private async updateRenderProgress(
    job: Job<RenderQueuePayload>,
    progress: RenderProgressPayload,
    renderIdOverride?: string,
  ): Promise<void> {
    const renderId = renderIdOverride
      ?? (this.isRenderJob(job.data) ? job.data.renderId : job.data.batchId);

    // Mettre à jour le progrès du job
    await job.updateProgress({
      stage: progress.stage,
      percentage: progress.percentage,
      message: progress.message,
      timestamp: progress.timestamp,
    });

    // Sauvegarder en base
    await this.prisma.renderProgress.upsert({
      where: { renderId },
      update: progress,
      create: {
        renderId,
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

  private isRenderJob(payload: RenderQueuePayload): payload is RenderJobData {
    return (payload as RenderJobData).renderId !== undefined;
  }

  /**
   * Sauvegarde les résultats du rendu
   */
  private async saveRenderResults(renderId: string, result: any, type: string): Promise<void> {
    await this.prisma.renderResult.upsert({
      where: { renderId },
      update: {
        type,
        status: result.status,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        metadata: result.metadata,
      },
      create: {
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
    await this.prisma.exportResult.upsert({
      where: { renderId },
      update: {
        format: result.format,
        url: result.url,
        size: result.size,
        metadata: result.metadata,
      },
      create: {
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
    
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return JSON.parse(cached);
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


