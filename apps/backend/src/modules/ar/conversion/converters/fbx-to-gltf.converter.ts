/**
 * AR Studio - FBX/OBJ/STEP to glTF Converter
 * Universal converter for common 3D formats to glTF 2.0 via Blender CLI
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface GltfConversionOptions {
  outputFormat?: 'gltf' | 'glb';
  scale?: number;
  yUp?: boolean;
  optimize?: boolean;
}

export interface GltfConversionResult {
  outputPath: string;
  fileSize: number;
  processingTimeMs: number;
  format: 'gltf' | 'glb';
}

@Injectable()
export class FbxToGltfConverter {
  private readonly logger = new Logger(FbxToGltfConverter.name);
  private readonly blenderPath: string;
  private readonly scriptPath: string;

  constructor(private readonly configService: ConfigService) {
    this.blenderPath = this.configService.get<string>('BLENDER_PATH') || '/usr/bin/blender';
    this.scriptPath = this.configService.get<string>('BLENDER_SCRIPTS_PATH') ||
      path.resolve(__dirname, '../../../../../scripts/blender');
  }

  /**
   * Convert FBX/OBJ/STL/3DS/STEP to glTF 2.0
   */
  async convert(
    inputUrl: string,
    sourceFormat: string,
    options: GltfConversionOptions = {},
  ): Promise<GltfConversionResult> {
    const startTime = Date.now();
    const outputFormat = options.outputFormat || 'glb';
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ar-gltf-'));
    const inputExt = sourceFormat.toLowerCase().replace('.', '');
    const inputPath = path.join(tmpDir, `input.${inputExt}`);
    const outputPath = path.join(tmpDir, `output.${outputFormat}`);

    try {
      // Download source file
      const response = await fetch(inputUrl);
      if (!response.ok) {
        throw new Error(`Failed to download source file: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(inputPath, buffer);

      // Run Blender conversion
      const scriptFile = path.join(this.scriptPath, 'convert_to_gltf.py');
      const args = [
        '-b',
        '-P', scriptFile,
        '--',
        '--input', inputPath,
        '--output', outputPath,
        '--format', outputFormat,
      ];

      if (options.scale && options.scale !== 1.0) {
        args.push('--scale', options.scale.toString());
      }
      if (options.yUp !== false) {
        args.push('--y-up');
      }

      this.logger.log(`Running Blender conversion: ${sourceFormat} -> ${outputFormat}`);

      const { stdout, stderr } = await execFileAsync(this.blenderPath, args, {
        timeout: 10 * 60 * 1000, // 10 min for large CAD files
        maxBuffer: 50 * 1024 * 1024,
      });

      if (stderr && stderr.includes('CONVERSION_ERROR')) {
        throw new Error(`Blender conversion failed: ${stderr.substring(0, 500)}`);
      }

      // Verify output
      const stats = await fs.stat(outputPath);

      this.logger.log(
        `Conversion complete: ${sourceFormat} -> ${outputFormat}, ` +
        `size: ${(stats.size / 1024 / 1024).toFixed(2)} MB, ` +
        `time: ${Date.now() - startTime}ms`,
      );

      return {
        outputPath,
        fileSize: stats.size,
        processingTimeMs: Date.now() - startTime,
        format: outputFormat,
      };
    } catch (error) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Check if a source format is supported by this converter
   */
  static isSupported(format: string): boolean {
    const supported = ['fbx', 'obj', 'stl', '3ds', 'step', 'stp', 'iges', 'igs'];
    return supported.includes(format.toLowerCase().replace('.', ''));
  }
}
