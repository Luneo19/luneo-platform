import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface WatermarkCheckResult {
  hasWatermark: boolean;
  confidence: number;
  regions?: string[];
  details: string;
}

/**
 * Basic watermark detection using image analysis heuristics.
 * Placeholder implementation: checks for common watermark patterns in corners
 * (e.g. uniform/semi-transparent overlays). For production, integrate a
 * dedicated watermark/logo detection service or ML model.
 */
@Injectable()
export class WatermarkDetectorService {
  private readonly logger = new Logger(WatermarkDetectorService.name);

  /** Corner region size as fraction of image dimension (e.g. 0.1 = 10% from edge) */
  private readonly cornerFraction = 0.15;

  async checkWatermark(imageUrl: string): Promise<WatermarkCheckResult> {
    this.logger.debug('Watermark check (basic heuristic)', {
      imageUrl: imageUrl.substring(0, 60),
    });

    try {
      const buffer = await this.fetchImageBuffer(imageUrl);
      if (!buffer || buffer.length === 0) {
        return {
          hasWatermark: false,
          confidence: 0,
          details: 'Could not fetch image for analysis',
        };
      }

      const meta = await sharp(buffer).metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      if (width < 16 || height < 16) {
        return {
          hasWatermark: false,
          confidence: 0,
          details: 'Image too small for corner analysis',
        };
      }

      const cornerW = Math.max(8, Math.floor(width * this.cornerFraction));
      const cornerH = Math.max(8, Math.floor(height * this.cornerFraction));

      const regions: string[] = [];
      let suspiciousCount = 0;

      // Extract corner regions and check for low variance (common in logo/watermark overlays)
      const corners = [
        { name: 'top-left', left: 0, top: 0 },
        { name: 'top-right', left: width - cornerW, top: 0 },
        { name: 'bottom-left', left: 0, top: height - cornerH },
        { name: 'bottom-right', left: width - cornerW, top: height - cornerH },
      ] as const;

      for (const corner of corners) {
        const regionBuffer = await sharp(buffer)
          .extract({
            left: corner.left,
            top: corner.top,
            width: cornerW,
            height: cornerH,
          })
          .grayscale()
          .raw()
          .toBuffer();

        const stats = this.computeRegionStats(new Uint8Array(regionBuffer));
        if (stats.variance < 500 && stats.mean > 0 && stats.mean < 250) {
          suspiciousCount++;
          regions.push(corner.name);
        }
      }

      const hasWatermark = suspiciousCount >= 2;
      const confidence = Math.min(1, (suspiciousCount / 4) * 0.6);

      return {
        hasWatermark,
        confidence,
        regions: regions.length > 0 ? regions : undefined,
        details: `Corner analysis: ${suspiciousCount}/4 regions with low variance (placeholder heuristic; use dedicated service for production).`,
      };
    } catch (error) {
      this.logger.warn('Watermark check failed', {
        error: error instanceof Error ? error.message : error,
      });
      return {
        hasWatermark: false,
        confidence: 0,
        details: `Analysis error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  private computeRegionStats(data: Uint8Array): { mean: number; variance: number } {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const mean = data.length > 0 ? sum / data.length : 0;
    let sqSum = 0;
    for (let i = 0; i < data.length; i++)
      sqSum += (data[i] - mean) * (data[i] - mean);
    const variance = data.length > 0 ? sqSum / data.length : 0;
    return { mean, variance };
  }
}
