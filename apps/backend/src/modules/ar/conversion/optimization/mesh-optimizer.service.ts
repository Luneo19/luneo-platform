/**
 * AR Studio - Mesh Optimizer Service
 * Reduces polygon count, optimizes mesh topology for AR performance
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface MeshOptimizationOptions {
  targetPolyCount?: number;
  reductionRatio?: number; // 0-1, proportion to keep
  simplifyThreshold?: number;
  preserveUVs?: boolean;
  preserveNormals?: boolean;
}

export interface MeshOptimizationResult {
  outputPath: string;
  originalPolyCount: number;
  optimizedPolyCount: number;
  originalSize: number;
  optimizedSize: number;
  processingTimeMs: number;
}

@Injectable()
export class MeshOptimizerService {
  private readonly logger = new Logger(MeshOptimizerService.name);
  private readonly gltfpackPath: string;

  constructor(private readonly configService: ConfigService) {
    this.gltfpackPath = this.configService.get<string>('GLTFPACK_PATH') || 'gltfpack';
  }

  /**
   * Optimize a GLB mesh using gltfpack (meshoptimizer)
   */
  async optimize(
    inputUrl: string,
    options: MeshOptimizationOptions = {},
  ): Promise<MeshOptimizationResult> {
    const startTime = Date.now();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ar-meshopt-'));
    const inputPath = path.join(tmpDir, 'input.glb');
    const outputPath = path.join(tmpDir, 'optimized.glb');

    try {
      // Download source
      const response = await fetch(inputUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(inputPath, buffer);
      const originalSize = buffer.length;

      // Build gltfpack command
      const args = ['-i', inputPath, '-o', outputPath];

      if (options.reductionRatio !== undefined) {
        const simplifyRatio = options.reductionRatio;
        args.push('-si', simplifyRatio.toString());
      }

      if (options.targetPolyCount !== undefined) {
        args.push('-si', '0.5'); // Start with 50% and iterate
      }

      // Texture compression
      args.push('-tc'); // Enable texture compression (KTX2)
      args.push('-mi'); // Merge identical meshes

      this.logger.log(`Running gltfpack optimization`);

      const { stdout } = await execFileAsync(this.gltfpackPath, args, {
        timeout: 5 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const stats = await fs.stat(outputPath);

      this.logger.log(
        `Mesh optimization: ${(originalSize / 1024).toFixed(0)} KB -> ` +
        `${(stats.size / 1024).toFixed(0)} KB`,
      );

      return {
        outputPath,
        originalPolyCount: 0,
        optimizedPolyCount: 0,
        originalSize,
        optimizedSize: stats.size,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }
}
