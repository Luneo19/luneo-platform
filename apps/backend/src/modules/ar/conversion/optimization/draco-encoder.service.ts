/**
 * AR Studio - Draco Compression Encoder
 * Compresses glTF meshes using Google Draco for smaller file sizes
 * Uses gltf-pipeline npm package
 */

import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface DracoOptions {
  compressionLevel?: number; // 0-10, default 7
  quantizePositionBits?: number; // default 14
  quantizeNormalBits?: number; // default 10
  quantizeTexcoordBits?: number; // default 12
}

export interface DracoResult {
  outputPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTimeMs: number;
}

@Injectable()
export class DracoEncoderService {
  private readonly logger = new Logger(DracoEncoderService.name);

  /**
   * Compress a glTF/GLB file with Draco
   */
  async compress(
    inputUrl: string,
    options: DracoOptions = {},
  ): Promise<DracoResult> {
    const startTime = Date.now();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ar-draco-'));
    const inputPath = path.join(tmpDir, 'input.glb');
    const outputPath = path.join(tmpDir, 'output-draco.glb');

    try {
      // Download source
      const response = await fetch(inputUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(inputPath, buffer);
      const originalSize = buffer.length;

      // Use gltf-pipeline for Draco compression
      const gltfPipelinePath = this.findGltfPipeline();

      const args = [
        gltfPipelinePath,
        '-i', inputPath,
        '-o', outputPath,
        '-d', // enable Draco compression
      ];

      if (options.compressionLevel !== undefined) {
        args.push('--draco.compressionLevel', options.compressionLevel.toString());
      }
      if (options.quantizePositionBits !== undefined) {
        args.push('--draco.quantizePositionBits', options.quantizePositionBits.toString());
      }
      if (options.quantizeNormalBits !== undefined) {
        args.push('--draco.quantizeNormalBits', options.quantizeNormalBits.toString());
      }
      if (options.quantizeTexcoordBits !== undefined) {
        args.push('--draco.quantizeTexcoordBits', options.quantizeTexcoordBits.toString());
      }

      this.logger.log(`Running Draco compression on ${(originalSize / 1024).toFixed(0)} KB file`);

      await execFileAsync('node', args, {
        timeout: 5 * 60 * 1000,
        maxBuffer: 50 * 1024 * 1024,
      });

      const stats = await fs.stat(outputPath);
      const compressionRatio = stats.size / originalSize;

      this.logger.log(
        `Draco compression: ${(originalSize / 1024).toFixed(0)} KB -> ` +
        `${(stats.size / 1024).toFixed(0)} KB (${(compressionRatio * 100).toFixed(1)}%)`,
      );

      return {
        outputPath,
        originalSize,
        compressedSize: stats.size,
        compressionRatio,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  private findGltfPipeline(): string {
    // Try common locations
    const paths = [
      path.resolve(__dirname, '../../../../../../node_modules/.bin/gltf-pipeline'),
      '/app/node_modules/.bin/gltf-pipeline',
      'gltf-pipeline',
    ];

    return paths[0]; // gltf-pipeline will be resolved by node
  }
}
