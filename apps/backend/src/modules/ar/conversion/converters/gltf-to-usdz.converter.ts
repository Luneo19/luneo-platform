/**
 * AR Studio - glTF to USDZ Converter
 * Converts glTF/GLB files to Apple USDZ format for AR Quick Look
 * Uses Blender CLI in Docker worker or CloudConvert as fallback
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface USDZConversionOptions {
  scale?: number;
  optimize?: boolean;
  appleQuickLookCompatible?: boolean;
}

export interface USDZConversionResult {
  outputPath: string;
  fileSize: number;
  processingTimeMs: number;
}

@Injectable()
export class GltfToUsdzConverter {
  private readonly logger = new Logger(GltfToUsdzConverter.name);
  private readonly blenderPath: string;
  private readonly scriptPath: string;
  private readonly useBlender: boolean;

  constructor(private readonly configService: ConfigService) {
    this.blenderPath = this.configService.get<string>('BLENDER_PATH') || '/usr/bin/blender';
    this.scriptPath = this.configService.get<string>('BLENDER_SCRIPTS_PATH') ||
      path.resolve(__dirname, '../../../../../scripts/blender');
    this.useBlender = this.configService.get<string>('AR_USE_BLENDER') === 'true';
  }

  /**
   * Convert glTF/GLB to USDZ
   */
  async convert(
    inputUrl: string,
    options: USDZConversionOptions = {},
  ): Promise<USDZConversionResult> {
    const startTime = Date.now();

    if (this.useBlender) {
      return this.convertViaBlender(inputUrl, options, startTime);
    }

    return this.convertViaCloudConvert(inputUrl, options, startTime);
  }

  /**
   * Convert via local Blender installation (Docker worker)
   */
  private async convertViaBlender(
    inputUrl: string,
    options: USDZConversionOptions,
    startTime: number,
  ): Promise<USDZConversionResult> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ar-usdz-'));
    const inputPath = path.join(tmpDir, 'input.glb');
    const outputPath = path.join(tmpDir, 'output.usdz');

    try {
      // Download source file
      const response = await fetch(inputUrl);
      if (!response.ok) {
        throw new Error(`Failed to download source file: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(inputPath, buffer);

      // Run Blender conversion
      const scriptFile = path.join(this.scriptPath, 'convert_to_usdz.py');
      const args = [
        '-b', // background mode
        '-P', scriptFile,
        '--',
        '--input', inputPath,
        '--output', outputPath,
      ];

      if (options.scale && options.scale !== 1.0) {
        args.push('--scale', options.scale.toString());
      }

      this.logger.log(`Running Blender USDZ conversion: ${this.blenderPath} ${args.join(' ')}`);

      const { stdout, stderr } = await execFileAsync(this.blenderPath, args, {
        timeout: 5 * 60 * 1000, // 5 min timeout
        maxBuffer: 50 * 1024 * 1024, // 50MB stdout buffer
      });

      if (stderr && stderr.includes('Error')) {
        this.logger.warn(`Blender stderr: ${stderr.substring(0, 500)}`);
      }

      // Verify output exists
      const stats = await fs.stat(outputPath);

      return {
        outputPath,
        fileSize: stats.size,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // Cleanup on error
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Convert via CloudConvert API (fallback when Blender not available)
   */
  private async convertViaCloudConvert(
    inputUrl: string,
    _options: USDZConversionOptions,
    startTime: number,
  ): Promise<USDZConversionResult> {
    const apiKey = this.configService.get<string>('CLOUDCONVERT_API_KEY');
    if (!apiKey) {
      throw new Error('CloudConvert API key not configured and Blender not available');
    }

    const apiBase = this.configService.get<string>('CLOUDCONVERT_API_URL') ||
      'https://api.cloudconvert.com/v2';

    // Create CloudConvert job
    const jobResponse = await fetch(`${apiBase}/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'import-file': { operation: 'import/url', url: inputUrl },
          'convert-usdz': {
            operation: 'convert',
            input: 'import-file',
            input_format: 'glb',
            output_format: 'usdz',
          },
          'export-result': { operation: 'export/url', input: 'convert-usdz', inline: false },
        },
      }),
    });

    if (!jobResponse.ok) {
      throw new Error(`CloudConvert job creation failed: ${jobResponse.statusText}`);
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.data.id;

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 120;
    const pollInterval = 3000;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`${apiBase}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const statusData = await statusResponse.json();
      const exportTask = statusData.data.tasks?.find(
        (t: { name: string }) => t.name === 'export-result',
      );

      if (exportTask?.status === 'finished') {
        const resultUrl = exportTask.result?.files?.[0]?.url;
        if (!resultUrl) {
          throw new Error('CloudConvert: no output URL in result');
        }

        // Download result to temp file
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ar-usdz-'));
        const outputPath = path.join(tmpDir, 'output.usdz');
        const resultResponse = await fetch(resultUrl);
        const resultBuffer = Buffer.from(await resultResponse.arrayBuffer());
        await fs.writeFile(outputPath, resultBuffer);

        return {
          outputPath,
          fileSize: resultBuffer.length,
          processingTimeMs: Date.now() - startTime,
        };
      }

      if (exportTask?.status === 'error' || statusData.data.status === 'error') {
        throw new Error(`CloudConvert conversion error: ${exportTask?.message || 'unknown'}`);
      }

      attempts++;
    }

    throw new Error('CloudConvert conversion timeout');
  }
}
