/**
 * AR Studio - Conversion Worker
 * BullMQ worker for async 3D model format conversion
 */

import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { FbxToGltfConverter } from '../conversion/converters/fbx-to-gltf.converter';
import { GltfToUsdzConverter } from '../conversion/converters/gltf-to-usdz.converter';
import { DracoEncoderService } from '../conversion/optimization/draco-encoder.service';
import { ARConversionStatus } from '@prisma/client';

interface ConversionJobData {
  conversionId: string;
  modelId: string;
  sourceFormat: string;
  targetFormat: string;
  sourceUrl: string;
  optimize: boolean;
}

@Processor('ar-conversion')
export class ConversionWorker {
  private readonly logger = new Logger(ConversionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly fbxToGltfConverter: FbxToGltfConverter,
    private readonly gltfToUsdzConverter: GltfToUsdzConverter,
    private readonly dracoEncoder: DracoEncoderService,
  ) {}

  @Process('convert-model')
  async handleConversion(job: Job<ConversionJobData>): Promise<void> {
    const { conversionId, modelId, sourceFormat, targetFormat, sourceUrl } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing conversion ${conversionId}: ${sourceFormat} -> ${targetFormat}`);

    try {
      // Mark as processing
      await this.prisma.aRModelConversion.update({
        where: { id: conversionId },
        data: { status: ARConversionStatus.PROCESSING },
      });

      await job.updateProgress(10);

      let outputPath: string;
      let fileSize: number;
      let compressionRatio: number | undefined;

      // Route to appropriate converter
      if (targetFormat === 'usdz') {
        // Need glTF/GLB first if source is not glTF
        let gltfUrl = sourceUrl;
        if (!['glb', 'gltf'].includes(sourceFormat)) {
          const gltfResult = await this.fbxToGltfConverter.convert(sourceUrl, sourceFormat, {
            outputFormat: 'glb',
          });
          // Upload intermediate GLB
          const gltfBuffer = await import('fs/promises').then((fs) => fs.readFile(gltfResult.outputPath));
          gltfUrl = await this.storageService.uploadBuffer(
            gltfBuffer,
            `ar-models/conversions/${modelId}/intermediate.glb`,
            { contentType: 'model/gltf-binary' },
          );
        }

        await job.updateProgress(50);

        const usdzResult = await this.gltfToUsdzConverter.convert(gltfUrl, {
          appleQuickLookCompatible: true,
        });
        outputPath = usdzResult.outputPath;
        fileSize = usdzResult.fileSize;
      } else if (targetFormat === 'draco') {
        // Draco compression (source must be glTF/GLB)
        let gltfUrl = sourceUrl;
        if (!['glb', 'gltf'].includes(sourceFormat)) {
          const gltfResult = await this.fbxToGltfConverter.convert(sourceUrl, sourceFormat, {
            outputFormat: 'glb',
          });
          const gltfBuffer = await import('fs/promises').then((fs) => fs.readFile(gltfResult.outputPath));
          gltfUrl = await this.storageService.uploadBuffer(
            gltfBuffer,
            `ar-models/conversions/${modelId}/intermediate.glb`,
            { contentType: 'model/gltf-binary' },
          );
        }

        await job.updateProgress(50);

        const dracoResult = await this.dracoEncoder.compress(gltfUrl, {
          compressionLevel: 7,
        });
        outputPath = dracoResult.outputPath;
        fileSize = dracoResult.compressedSize;
        compressionRatio = dracoResult.compressionRatio;
      } else {
        // Convert to glTF/GLB
        const result = await this.fbxToGltfConverter.convert(sourceUrl, sourceFormat, {
          outputFormat: targetFormat as 'gltf' | 'glb',
        });
        outputPath = result.outputPath;
        fileSize = result.fileSize;
      }

      await job.updateProgress(80);

      // Upload result to CDN
      const fileBuffer = await import('fs/promises').then((fs) => fs.readFile(outputPath));
      const contentType = this.getContentType(targetFormat);
      const cdnUrl = await this.storageService.uploadBuffer(
        fileBuffer,
        `ar-models/${modelId}/${targetFormat}/model.${targetFormat === 'draco' ? 'glb' : targetFormat}`,
        { contentType },
      );

      // Update model with converted URL
      const updateData: Record<string, string> = {};
      switch (targetFormat) {
        case 'glb':
        case 'gltf':
          updateData.gltfURL = cdnUrl;
          break;
        case 'usdz':
          updateData.usdzURL = cdnUrl;
          break;
        case 'draco':
          updateData.gltfDracoURL = cdnUrl;
          break;
      }

      await this.prisma.aR3DModel.update({
        where: { id: modelId },
        data: updateData,
      });

      // Mark conversion as completed
      const processingTime = Date.now() - startTime;
      await this.prisma.aRModelConversion.update({
        where: { id: conversionId },
        data: {
          status: ARConversionStatus.COMPLETED,
          processingTime,
          compressionRatio,
          qualityScore: 1.0,
          completedAt: new Date(),
        },
      });

      // Cleanup temp files
      await import('fs/promises')
        .then((fs) => fs.rm(outputPath, { recursive: true, force: true }))
        .catch(() => {});

      await job.updateProgress(100);

      this.logger.log(
        `Conversion ${conversionId} completed: ${sourceFormat} -> ${targetFormat} ` +
        `(${processingTime}ms, ${(fileSize / 1024).toFixed(0)} KB)`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Conversion ${conversionId} failed: ${errorMessage}`, errorStack);

      await this.prisma.aRModelConversion.update({
        where: { id: conversionId },
        data: {
          status: ARConversionStatus.FAILED,
          errorMessage,
          errorStack: errorStack || null,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  @OnQueueFailed()
  onFailed(job: Job<ConversionJobData>, error: Error): void {
    this.logger.error(
      `Conversion job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ConversionJobData>): void {
    this.logger.log(`Conversion job ${job.id} completed`);
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'glb':
      case 'draco':
        return 'model/gltf-binary';
      case 'gltf':
        return 'model/gltf+json';
      case 'usdz':
        return 'model/vnd.usdz+zip';
      default:
        return 'application/octet-stream';
    }
  }
}
