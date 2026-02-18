/**
 * AR Studio - Texture Compressor Service
 * Compresses and optimizes textures for AR/mobile delivery
 * Uses sharp for image processing
 */

import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface TextureCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  generateMipmaps?: boolean;
}

export interface TextureCompressionResult {
  textures: Array<{
    name: string;
    originalSize: number;
    compressedSize: number;
    width: number;
    height: number;
    format: string;
    outputPath: string;
  }>;
  totalOriginalSize: number;
  totalCompressedSize: number;
  compressionRatio: number;
  processingTimeMs: number;
}

@Injectable()
export class TextureCompressorService {
  private readonly logger = new Logger(TextureCompressorService.name);

  /**
   * Compress a single texture image
   */
  async compressTexture(
    inputBuffer: Buffer,
    name: string,
    options: TextureCompressionOptions = {},
  ): Promise<{
    outputBuffer: Buffer;
    originalSize: number;
    compressedSize: number;
    width: number;
    height: number;
  }> {
    const originalSize = inputBuffer.length;
    const maxWidth = options.maxWidth || 2048;
    const maxHeight = options.maxHeight || 2048;
    const quality = options.quality || 80;
    const format = options.format || 'webp';

    let pipeline = sharp(inputBuffer);

    // Get metadata
    const metadata = await pipeline.metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    // Resize if necessary (maintain aspect ratio)
    if (origWidth > maxWidth || origHeight > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Ensure power-of-two dimensions for WebGL compatibility
    const targetWidth = this.nearestPowerOfTwo(Math.min(origWidth, maxWidth));
    const targetHeight = this.nearestPowerOfTwo(Math.min(origHeight, maxHeight));

    pipeline = pipeline.resize(targetWidth, targetHeight, { fit: 'fill' });

    // Apply format-specific compression
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 6 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 6 });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, palette: false });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();

    this.logger.log(
      `Texture ${name}: ${(originalSize / 1024).toFixed(0)} KB -> ` +
      `${(outputBuffer.length / 1024).toFixed(0)} KB ` +
      `(${origWidth}x${origHeight} -> ${targetWidth}x${targetHeight})`,
    );

    return {
      outputBuffer,
      originalSize,
      compressedSize: outputBuffer.length,
      width: targetWidth,
      height: targetHeight,
    };
  }

  /**
   * Generate a thumbnail for a 3D model from its first texture or rendered preview
   */
  async generateThumbnail(
    inputBuffer: Buffer,
    size: number = 512,
  ): Promise<Buffer> {
    return sharp(inputBuffer)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();
  }

  /**
   * Calculate nearest power of two (for WebGL texture compatibility)
   */
  private nearestPowerOfTwo(value: number): number {
    const powers = [64, 128, 256, 512, 1024, 2048, 4096];
    for (const p of powers) {
      if (value <= p) return p;
    }
    return 4096;
  }
}
