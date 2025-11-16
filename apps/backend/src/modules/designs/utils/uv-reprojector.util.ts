import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

export interface UVBBox {
  min: { u: number; v: number };
  max: { u: number; v: number };
}

export interface ReprojectionOptions {
  maskImageBuffer: Buffer;
  sourceUVBBox: UVBBox;
  targetUVBBox: UVBBox;
  sourceTextureWidth: number;
  sourceTextureHeight: number;
  targetTextureWidth: number;
  targetTextureHeight: number;
}

/**
 * Utility for reprojecting UV masks onto model UVs
 * Handles UV coordinate mismatches and provides fallback reprojection
 */
@Injectable()
export class UVReprojectorUtil {
  /**
   * Reproject a mask from source UV coordinates to target UV coordinates
   */
  async reprojectMask(options: ReprojectionOptions): Promise<Buffer> {
    const {
      maskImageBuffer,
      sourceUVBBox,
      targetUVBBox,
      sourceTextureWidth,
      sourceTextureHeight,
      targetTextureWidth,
      targetTextureHeight,
    } = options;

    try {
      // Load source mask image
      const sourceImage = sharp(maskImageBuffer);
      const sourceMetadata = await sourceImage.metadata();

      // Calculate source region bounds in pixels
      const sourceX = Math.floor(sourceUVBBox.min.u * sourceTextureWidth);
      const sourceY = Math.floor((1 - sourceUVBBox.max.v) * sourceTextureHeight);
      const sourceWidth = Math.ceil(
        (sourceUVBBox.max.u - sourceUVBBox.min.u) * sourceTextureWidth
      );
      const sourceHeight = Math.ceil(
        (sourceUVBBox.max.v - sourceUVBBox.min.v) * sourceTextureHeight
      );

      // Extract source region
      const sourceRegion = await sourceImage
        .extract({
          left: Math.max(0, sourceX),
          top: Math.max(0, sourceY),
          width: Math.min(sourceWidth, sourceMetadata.width! - sourceX),
          height: Math.min(sourceHeight, sourceMetadata.height! - sourceY),
        })
        .toBuffer();

      // Calculate target region bounds in pixels
      const targetX = Math.floor(targetUVBBox.min.u * targetTextureWidth);
      const targetY = Math.floor((1 - targetUVBBox.max.v) * targetTextureHeight);
      const targetWidth = Math.ceil(
        (targetUVBBox.max.u - targetUVBBox.min.u) * targetTextureWidth
      );
      const targetHeight = Math.ceil(
        (targetUVBBox.max.v - targetUVBBox.min.v) * targetTextureHeight
      );

      // Create target canvas
      const targetCanvas = sharp({
        create: {
          width: targetTextureWidth,
          height: targetTextureHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      });

      // Resize and composite source region onto target
      const resizedSource = await sharp(sourceRegion)
        .resize(targetWidth, targetHeight, {
          fit: 'fill',
          kernel: sharp.kernel.lanczos3,
        })
        .toBuffer();

      const reprojected = await targetCanvas
        .composite([
          {
            input: resizedSource,
            left: Math.max(0, targetX),
            top: Math.max(0, targetY),
          },
        ])
        .png()
        .toBuffer();

      return reprojected;
    } catch (error) {
      console.error('UV reprojection error:', error);
      // Fallback: return original mask with warning
      return this.fallbackReprojection(options);
    }
  }

  /**
   * Fallback reprojection when exact mapping fails
   * Uses simple scaling and translation
   */
  private async fallbackReprojection(
    options: ReprojectionOptions
  ): Promise<Buffer> {
    const {
      maskImageBuffer,
      sourceUVBBox,
      targetUVBBox,
      targetTextureWidth,
      targetTextureHeight,
    } = options;

    // Calculate scale factors
    const sourceWidth = sourceUVBBox.max.u - sourceUVBBox.min.u;
    const sourceHeight = sourceUVBBox.max.v - sourceUVBBox.min.v;
    const targetWidth = targetUVBBox.max.u - targetUVBBox.min.u;
    const targetHeight = targetUVBBox.max.v - targetUVBBox.min.v;

    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;

    // Create target canvas
    const targetCanvas = sharp({
      create: {
        width: targetTextureWidth,
        height: targetTextureHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    // Resize mask to target size
    const resizedMask = await sharp(maskImageBuffer)
      .resize(
        Math.floor(targetWidth * targetTextureWidth),
        Math.floor(targetHeight * targetTextureHeight),
        {
          fit: 'fill',
        }
      )
      .toBuffer();

    // Composite onto target
    const targetX = Math.floor(targetUVBBox.min.u * targetTextureWidth);
    const targetY = Math.floor((1 - targetUVBBox.max.v) * targetTextureHeight);

    const reprojected = await targetCanvas
      .composite([
        {
          input: resizedMask,
          left: Math.max(0, targetX),
          top: Math.max(0, targetY),
        },
      ])
      .png()
      .toBuffer();

    return reprojected;
  }

  /**
   * Validate UV coordinates are within valid range [0, 1]
   */
  validateUVBBox(uvBBox: UVBBox): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (
      uvBBox.min.u < 0 ||
      uvBBox.min.v < 0 ||
      uvBBox.max.u > 1 ||
      uvBBox.max.v > 1
    ) {
      warnings.push('UV coordinates outside [0,1] range - clamping applied');
    }

    if (uvBBox.min.u >= uvBBox.max.u || uvBBox.min.v >= uvBBox.max.v) {
      return {
        valid: false,
        warnings: ['Invalid UV bounding box: min >= max'],
      };
    }

    return {
      valid: true,
      warnings,
    };
  }

  /**
   * Clamp UV coordinates to valid range [0, 1]
   */
  clampUVBBox(uvBBox: UVBBox): UVBBox {
    return {
      min: {
        u: Math.max(0, Math.min(1, uvBBox.min.u)),
        v: Math.max(0, Math.min(1, uvBBox.min.v)),
      },
      max: {
        u: Math.max(0, Math.min(1, uvBBox.max.u)),
        v: Math.max(0, Math.min(1, uvBBox.max.v)),
      },
    };
  }
}
