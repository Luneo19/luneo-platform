/**
 * AR Studio - Optimization Worker
 * BullMQ worker for async 3D model optimization (LOD, Draco, textures)
 */

import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { LODGeneratorService } from '../conversion/optimization/lod-generator.service';
import { TextureCompressorService } from '../conversion/optimization/texture-compressor.service';
import { MeshOptimizerService } from '../conversion/optimization/mesh-optimizer.service';

interface LODJobData {
  modelId: string;
  levels: Array<{ name: string; polyReduction: number }>;
}

interface _TextureOptJobData {
  modelId: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface MeshOptJobData {
  modelId: string;
  reductionRatio?: number;
}

@Processor('ar-optimization')
export class OptimizationWorker {
  private readonly logger = new Logger(OptimizationWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly lodGenerator: LODGeneratorService,
    private readonly textureCompressor: TextureCompressorService,
    private readonly meshOptimizer: MeshOptimizerService,
  ) {}

  @Process('generate-lods')
  async handleLODGeneration(job: Job<LODJobData>): Promise<void> {
    const { modelId, levels } = job.data;
    this.logger.log(`Generating LODs for model ${modelId}`);

    try {
      const model = await this.prisma.aR3DModel.findUnique({ where: { id: modelId } });
      if (!model) throw new Error(`Model not found: ${modelId}`);

      const sourceUrl = model.gltfURL || model.originalFileURL;
      const result = await this.lodGenerator.generateLODs(sourceUrl, levels);

      // Upload each LOD level
      const lodLevels: Record<string, string> = {};

      for (const level of result.levels) {
        const buffer = await import('fs/promises').then((fs) => fs.readFile(level.outputPath));
        const cdnUrl = await this.storageService.uploadBuffer(
          buffer,
          `ar-models/${modelId}/lods/${level.name}.glb`,
          { contentType: 'model/gltf-binary' },
        );
        lodLevels[level.name] = cdnUrl;
      }

      // Determine recommended LOD based on file sizes
      const recommendedLOD = result.levels.length > 1 ? 'lod1' : 'lod0';

      // Update model
      await this.prisma.aR3DModel.update({
        where: { id: modelId },
        data: {
          lodLevels: lodLevels as import('@prisma/client').Prisma.InputJsonValue,
          recommendedLOD,
        },
      });

      // Cleanup temp files
      for (const level of result.levels) {
        await import('fs/promises')
          .then((fs) => fs.rm(level.outputPath, { force: true }))
          .catch(() => {});
      }

      this.logger.log(
        `LOD generation complete for ${modelId}: ${result.levels.length} levels in ${result.processingTimeMs}ms`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`LOD generation failed for ${modelId}: ${errorMsg}`);
      throw error;
    }
  }

  @Process('optimize-mesh')
  async handleMeshOptimization(job: Job<MeshOptJobData>): Promise<void> {
    const { modelId, reductionRatio } = job.data;
    this.logger.log(`Optimizing mesh for model ${modelId}`);

    try {
      const model = await this.prisma.aR3DModel.findUnique({ where: { id: modelId } });
      if (!model) throw new Error(`Model not found: ${modelId}`);

      const sourceUrl = model.gltfURL || model.originalFileURL;
      const result = await this.meshOptimizer.optimize(sourceUrl, { reductionRatio });

      const buffer = await import('fs/promises').then((fs) => fs.readFile(result.outputPath));
      const cdnUrl = await this.storageService.uploadBuffer(
        buffer,
        `ar-models/${modelId}/optimized.glb`,
        { contentType: 'model/gltf-binary' },
      );

      await this.prisma.aR3DModel.update({
        where: { id: modelId },
        data: { gltfURL: cdnUrl },
      });

      await import('fs/promises')
        .then((fs) => fs.rm(result.outputPath, { force: true }))
        .catch(() => {});

      this.logger.log(`Mesh optimization complete for ${modelId}: ${result.processingTimeMs}ms`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Mesh optimization failed for ${modelId}: ${errorMsg}`);
      throw error;
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Optimization job ${job.id} (${job.name}) failed: ${error.message}`);
  }
}
