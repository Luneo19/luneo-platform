/**
 * Feature Extractor - Extract image feature points using sharp.
 * Provides a simple edge/corner-style metric for AR target suitability.
 */

import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface FeatureExtractionResult {
  featurePointCount: number;
  descriptorLength?: number;
  descriptor?: Buffer;
}

@Injectable()
export class FeatureExtractorService {
  private readonly logger = new Logger(FeatureExtractorService.name);

  /**
   * Extract a proxy for "feature points" from the image (edge/corner-like count).
   * Does not implement full ORB/SIFT; used for quality hints only.
   */
  async extractFeatures(imageBuffer: Buffer): Promise<FeatureExtractionResult> {
    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width < 2 || height < 2) {
      return { featurePointCount: 0 };
    }

    const gray = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer();

    const count = this.countStrongEdges(gray, width, height);
    this.logger.debug(`Extracted ~${count} feature points from image ${width}x${height}`);

    return {
      featurePointCount: count,
      descriptorLength: 0,
    };
  }

  private countStrongEdges(gray: Buffer, width: number, height: number): number {
    let count = 0;
    const threshold = 25;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const _g = gray[i];
        const dx = Math.abs(gray[i + 1] - gray[i - 1]);
        const dy = Math.abs(gray[i + width] - gray[i - width]);
        if (dx > threshold && dy > threshold) count++;
      }
    }
    return Math.min(count, 10000);
  }
}
