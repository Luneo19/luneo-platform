/**
 * Configurator 3D - 3D/AR Export Worker
 * BullMQ worker for exporting 3D models and AR-ready assets
 */

import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExportStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

export interface Export3DJobData {
  exportId: string;
  sessionId: string | null;
  configurationId: string;
  format?: string;
  options?: Record<string, unknown>;
}

@Processor('configurator-3d-export-3d')
export class Export3DWorker {
  private readonly logger = new Logger(Export3DWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('export-3d')
  async handleExport3D(job: Job<Export3DJobData>): Promise<void> {
    await this.processExport(job, '3d');
  }

  @Process('export-ar')
  async handleExportAR(job: Job<Export3DJobData>): Promise<void> {
    await this.processExport(job, 'ar');
  }

  private async processExport(
    job: Job<Export3DJobData>,
    type: '3d' | 'ar',
  ): Promise<void> {
    const { exportId, sessionId, configurationId, format, options } = job.data;

    this.logger.log(
      `Processing ${type.toUpperCase()} export ${exportId} for configuration ${configurationId}`,
    );

    try {
      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: { status: ExportStatus.PROCESSING, progress: 10 },
      });

      const configuration =
        await this.prisma.configurator3DConfiguration.findUnique({
          where: { id: configurationId },
        });

      if (!configuration) {
        throw new Error(`Configuration ${configurationId} not found`);
      }

      const modelUrl = configuration.modelUrl;
      if (!modelUrl) {
        throw new Error(
          `Configuration ${configurationId} has no model URL`,
        );
      }

      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: { progress: 40 },
      });

      const exportFormat = format ?? configuration.modelFormat ?? 'glb';
      let fileUrl: string;
      let fileName: string;
      let fileSize: number;

      if (type === 'ar') {
        const arModelUrl = await this.prepareARModelUrl(
          modelUrl,
          exportFormat,
          configuration.brandId,
          options,
        );
        fileUrl = arModelUrl.url;
        fileName = arModelUrl.fileName;
        fileSize = arModelUrl.fileSize ?? 0;
      } else {
        const downloadResult = await this.prepare3DDownloadUrl(
          modelUrl,
          exportFormat,
          configuration.brandId,
          exportId,
          options,
        );
        fileUrl = downloadResult.url;
        fileName = downloadResult.fileName;
        fileSize = downloadResult.fileSize ?? 0;
      }

      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.COMPLETED,
          fileUrl,
          fileName,
          fileSize,
          progress: 100,
          completedAt: new Date(),
          errorMessage: null,
        },
      });

      this.eventEmitter.emit('configurator-3d.export.completed', {
        exportId,
        configurationId,
        sessionId,
        type: type === 'ar' ? 'AR' : 'MODEL_3D',
        fileUrl,
        fileName,
        fileSize,
      });

      this.logger.log(`${type.toUpperCase()} export ${exportId} completed successfully`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`${type.toUpperCase()} export ${exportId} failed: ${errorMsg}`);

      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.FAILED,
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private async prepareARModelUrl(
    modelUrl: string,
    format: string,
    brandId: string,
    _options?: Record<string, unknown>,
  ): Promise<{ url: string; fileName: string; fileSize?: number }> {
    if (modelUrl.startsWith('http')) {
      return {
        url: modelUrl,
        fileName: `ar-model.${format}`,
        fileSize: undefined,
      };
    }

    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `ar-export-${Date.now()}.${format}`;
    const key = `configurator-3d/ar-exports/${fileName}`;

    const url = await this.storageService.uploadFile(
      key,
      buffer,
      format === 'glb' || format === 'gltf' ? 'model/gltf-binary' : 'application/octet-stream',
      'luneo-assets',
      brandId,
    );

    return { url, fileName, fileSize: buffer.length };
  }

  private async prepare3DDownloadUrl(
    modelUrl: string,
    format: string,
    brandId: string,
    exportId: string,
    _options?: Record<string, unknown>,
  ): Promise<{ url: string; fileName: string; fileSize?: number }> {
    if (modelUrl.startsWith('http')) {
      const url = new URL(modelUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1] || `model-${exportId}.${format}`;
      return {
        url: modelUrl,
        fileName,
        fileSize: undefined,
      };
    }

    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `configurator-3d-export-${exportId}.${format}`;
    const key = `configurator-3d/exports/${exportId}/${fileName}`;

    const url = await this.storageService.uploadFile(
      key,
      buffer,
      format === 'glb' || format === 'gltf' ? 'model/gltf-binary' : 'application/octet-stream',
      'luneo-assets',
      brandId,
    );

    return { url, fileName, fileSize: buffer.length };
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `3D/AR export job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
