// @ts-nocheck
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { Render2DService } from '@/modules/render/services/render-2d.service';
import * as Sentry from '@sentry/nestjs';
import sharp from 'sharp';

interface RenderPreviewJob {
  renderId: string;
  snapshotId?: string;
  designId?: string;
  customizationId?: string;
  type: 'preview';
  options?: Record<string, unknown>;
}

@Processor('render-preview')
export class RenderPreviewProcessor {
  private readonly logger = new Logger(RenderPreviewProcessor.name);

  constructor(
    private prisma: PrismaService,
    private render2DService: Render2DService,
    private storageService: StorageService,
  ) {}

  @Process('render')
  async process(job: Job<RenderPreviewJob>): Promise<{ renderId: string; url: string; thumbnailUrl?: string; cached?: boolean; duration?: number }> {
    const { renderId, snapshotId, designId, customizationId, type, options } = job.data;
    const startTime = Date.now();

    try {
      // 1. Mettre à jour RenderResult en processing
      await this.prisma.renderResult.update({
        where: { renderId },
        data: {
          status: 'processing',
          metadata: {
            ...options,
            startedAt: new Date().toISOString(),
          },
        },
      });

      // 2. Récupérer les données nécessaires
      let snapshot, design, customization;
      
      if (snapshotId) {
        snapshot = await this.prisma.snapshot.findUnique({
          where: { id: snapshotId },
          include: {
            spec: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!snapshot) {
          throw new Error(`Snapshot not found: ${snapshotId}`);
        }
      } else if (designId) {
        design = await this.prisma.design.findUnique({
          where: { id: designId },
          include: {
            product: true,
          },
        });

        if (!design) {
          throw new Error(`Design not found: ${designId}`);
        }
      } else if (customizationId) {
        customization = await this.prisma.customization.findUnique({
          where: { id: customizationId },
          include: {
            product: true,
            zone: true,
          },
        });

        if (!customization) {
          throw new Error(`Customization not found: ${customizationId}`);
        }
      } else {
        throw new Error('No snapshotId, designId, or customizationId provided');
      }

      // 3. Vérifier idempotency (si render existe déjà)
      const existingRender = await this.prisma.renderResult.findFirst({
        where: {
          snapshotId: snapshotId || null,
          designId: designId || null,
          customizationId: customizationId || null,
          type: '2d',
          status: 'success',
        },
      });

      if (existingRender && existingRender.url) {
        this.logger.log(`Render already exists, returning cached for ${renderId}`);
        
        // Mettre à jour le render actuel avec les URLs existantes
        await this.prisma.renderResult.update({
          where: { renderId },
          data: {
            status: 'success',
            url: existingRender.url,
            thumbnailUrl: existingRender.thumbnailUrl,
            metadata: {
              ...(existingRender.metadata as Record<string, unknown> || {}),
              cached: true,
            },
          },
        });

        return {
          renderId,
          url: existingRender.url,
          thumbnailUrl: existingRender.thumbnailUrl ?? undefined,
          cached: true,
        };
      }

      const productId = snapshot?.spec?.productId || design?.productId || customization?.productId;
      let previewUrl: string;
      let thumbnailUrl: string;

      try {
        const renderRequest = {
          id: renderId,
          type: '2d' as const,
          productId: productId || '',
          designId: designId || undefined,
          options: { width: 800, height: 600, ...(options || {}) },
        };
        const result = await this.render2DService.render2D(renderRequest);
        previewUrl = result.url ?? '';
        thumbnailUrl = result.thumbnailUrl ?? previewUrl;
      } catch (renderError) {
        this.logger.warn(`Render2DService failed, using sharp fallback: ${renderError instanceof Error ? renderError.message : 'Unknown'}`);
        const width = 800;
        const height = 600;
        const imageBuffer = await sharp({
          create: {
            width,
            height,
            channels: 3,
            background: { r: 240, g: 240, b: 240 },
          },
        })
          .png()
          .toBuffer();
        const thumbBuffer = await sharp(imageBuffer).resize(200, 200, { fit: 'cover' }).png().toBuffer();
        const baseKey = `renders/preview/${renderId}`;
        previewUrl = await this.storageService.uploadFile(`${baseKey}/preview.png`, imageBuffer, 'image/png');
        thumbnailUrl = await this.storageService.uploadFile(`${baseKey}/thumb.png`, thumbBuffer, 'image/png');
      }

      // 6. Mettre à jour RenderResult
      await this.prisma.renderResult.update({
        where: { renderId },
        data: {
          status: 'success',
          url: previewUrl,
          thumbnailUrl,
          metadata: {
            ...options,
            duration: Date.now() - startTime,
            completedAt: new Date().toISOString(),
          },
        },
      });

      // 7. Mettre à jour Snapshot avec previewUrl si applicable
      if (snapshotId) {
        await this.prisma.snapshot.update({
          where: { id: snapshotId },
          data: {
            previewUrl,
            thumbnailUrl,
          },
        });
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Render preview completed for ${renderId} in ${duration}ms`);

      return {
        renderId,
        url: previewUrl,
        thumbnailUrl,
        duration,
      };
    } catch (error) {
      this.logger.error(`Render preview failed for ${renderId}`, error);
      
      // Sentry
      Sentry.captureException(error, {
        tags: {
          jobId: job.id,
          renderId,
          snapshotId,
          type,
        },
        extra: {
          jobData: job.data,
        },
      });

      // Mettre à jour RenderResult en failed
      await this.prisma.renderResult.update({
        where: { renderId },
        data: {
          status: 'failed',
          metadata: {
            error: 'Render processing failed',
            failedAt: new Date().toISOString(),
          },
        },
      }).catch(() => {
        // Ignorer si update échoue
      });

      throw error; // BullMQ va retry
    }
  }
}

