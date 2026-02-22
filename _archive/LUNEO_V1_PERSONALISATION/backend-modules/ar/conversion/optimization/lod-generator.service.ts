/**
 * AR Studio - LOD (Level of Detail) Generator
 * Generates multiple quality levels for progressive loading
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface LODLevel {
  name: string;
  polyReduction: number; // 0 = full, 0.5 = 50% reduction, 0.8 = 80% reduction
}

export interface LODResult {
  levels: Array<{
    name: string;
    outputPath: string;
    fileSize: number;
    polyCount: number;
    reductionRatio: number;
  }>;
  processingTimeMs: number;
}

@Injectable()
export class LODGeneratorService {
  private readonly logger = new Logger(LODGeneratorService.name);
  private readonly blenderPath: string;

  constructor(private readonly configService: ConfigService) {
    this.blenderPath = this.configService.get<string>('BLENDER_PATH') || '/usr/bin/blender';
  }

  /**
   * Generate LOD levels for a 3D model
   */
  async generateLODs(
    inputUrl: string,
    levels: LODLevel[] = [
      { name: 'lod0', polyReduction: 0 },
      { name: 'lod1', polyReduction: 0.5 },
      { name: 'lod2', polyReduction: 0.8 },
    ],
  ): Promise<LODResult> {
    const startTime = Date.now();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ar-lod-'));
    const inputPath = path.join(tmpDir, 'input.glb');
    const results: LODResult['levels'] = [];

    try {
      // Download source
      const response = await fetch(inputUrl);
      if (!response.ok) {
        throw new Error(`Failed to download source: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(inputPath, buffer);

      for (const level of levels) {
        const outputPath = path.join(tmpDir, `${level.name}.glb`);

        if (level.polyReduction === 0) {
          // LOD0 = original quality, just copy
          await fs.copyFile(inputPath, outputPath);
        } else {
          // Use Blender decimate modifier for poly reduction
          await this.decimateWithBlender(inputPath, outputPath, level.polyReduction);
        }

        const stats = await fs.stat(outputPath);

        results.push({
          name: level.name,
          outputPath,
          fileSize: stats.size,
          polyCount: 0, // Would need to parse the glTF to get exact count
          reductionRatio: level.polyReduction,
        });

        this.logger.log(
          `LOD ${level.name}: ${(stats.size / 1024).toFixed(0)} KB ` +
          `(${(level.polyReduction * 100).toFixed(0)}% reduction)`,
        );
      }

      return {
        levels: results,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Use Blender's Decimate modifier to reduce polygon count
   */
  private async decimateWithBlender(
    inputPath: string,
    outputPath: string,
    reductionRatio: number,
  ): Promise<void> {
    // Inline Python script for Blender decimation
    const decimateRatio = 1 - reductionRatio; // Blender uses ratio to KEEP
    const pythonScript = `
import bpy
import sys

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="${inputPath.replace(/\\/g, '/')}")

for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        bpy.context.view_layer.objects.active = obj
        mod = obj.modifiers.new(name='Decimate', type='DECIMATE')
        mod.ratio = ${decimateRatio}
        bpy.ops.object.modifier_apply(modifier=mod.name)

bpy.ops.export_scene.gltf(
    filepath="${outputPath.replace(/\\/g, '/')}",
    export_format='GLB',
    export_draco_mesh_compression_enable=False,
)
print("LOD_GENERATION_SUCCESS")
sys.exit(0)
`;

    const tmpScript = `${inputPath}_decimate.py`;
    const fsModule = await import('fs/promises');
    await fsModule.writeFile(tmpScript, pythonScript);

    try {
      await execFileAsync(this.blenderPath, ['-b', '-P', tmpScript], {
        timeout: 5 * 60 * 1000,
        maxBuffer: 50 * 1024 * 1024,
      });
    } finally {
      await fsModule.unlink(tmpScript).catch(() => {});
    }
  }
}
