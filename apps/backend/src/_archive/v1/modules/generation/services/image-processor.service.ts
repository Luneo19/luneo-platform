import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import { StorageService } from '@/libs/storage/storage.service';
import sharp from 'sharp';

export type ComposeEffect = 'none' | 'engrave' | 'emboss' | '3d_shadow';

export interface ComposeZone {
  id: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  renderStyle?: string;
}

interface ComposeParams {
  baseImage: Buffer;
  generatedOverlay: Buffer;
  customizationZones: ComposeZone[];
  customizations: Record<string, unknown>;
  outputFormat: string;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private readonly storage: StorageService) {}

  /**
   * Download image from URL or read from local path.
   */
  async downloadImage(urlOrPath: string): Promise<Buffer> {
    if (urlOrPath.startsWith('http')) {
      const response = await fetch(urlOrPath);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    return fs.promises.readFile(urlOrPath);
  }

  /**
   * Apply visual effect to overlay (engrave, emboss, 3D shadow).
   */
  private async applyEffect(
    imageBuffer: Buffer,
    effect?: ComposeEffect | string,
  ): Promise<Buffer> {
    const normalized =
      effect === 'engrave' || effect === 'emboss' || effect === '3d_shadow'
        ? effect
        : effect === 'engraved' || effect === 'ENGRAVED'
          ? 'engrave'
          : effect === 'embossed' || effect === 'EMBOSSED'
            ? 'emboss'
            : effect === '3d' || effect === 'THREE_D' || effect === '3d_shadow'
              ? '3d_shadow'
              : 'none';

    if (!normalized || normalized === 'none') return imageBuffer;

    switch (normalized) {
      case 'engrave': {
        return sharp(imageBuffer)
          .grayscale()
          .negate()
          .modulate({ brightness: 0.7 })
          .ensureAlpha()
          .toBuffer();
      }
      case 'emboss': {
        return sharp(imageBuffer)
          .convolve({
            width: 3,
            height: 3,
            kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
          })
          .ensureAlpha()
          .toBuffer();
      }
      case '3d_shadow': {
        const shadow = await sharp(imageBuffer)
          .modulate({ brightness: 0.3 })
          .blur(3)
          .ensureAlpha()
          .toBuffer();

        const metadata = await sharp(imageBuffer).metadata();
        const w = metadata.width ?? 100;
        const h = metadata.height ?? 100;
        const shadowOffset = 4;

        return sharp({
          create: {
            width: w + shadowOffset,
            height: h + shadowOffset,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite([
            { input: shadow, left: shadowOffset, top: shadowOffset },
            { input: imageBuffer, left: 0, top: 0 },
          ])
          .png()
          .toBuffer();
      }
      default:
        return imageBuffer;
    }
  }

  /**
   * Get effect for a zone from zone.renderStyle or customizations[zoneId].
   */
  private getEffectForZone(zone: ComposeZone, customizations: Record<string, unknown>): ComposeEffect | string {
    const zoneCustom = customizations[zone.id] as { effect?: string } | undefined;
    const effect =
      (typeof zoneCustom?.effect === 'string' && zoneCustom.effect) ||
      zone.renderStyle ||
      'none';
    return effect;
  }

  /**
   * Multi-layer composition from URLs: load base, load overlay, position on zone, apply effect, return composed buffer.
   * Use this for single-zone composition when you have URLs (e.g. product base image + generated overlay).
   */
  async composeImage(params: {
    baseImageUrl: string;
    overlayImageUrl: string;
    zone: { x: number; y: number; width: number; height: number };
    effect?: ComposeEffect;
    outputFormat?: string;
  }): Promise<Buffer> {
    const baseBuffer = await this.downloadImage(params.baseImageUrl);
    const overlayBuffer = await this.downloadImage(params.overlayImageUrl);

    const resizedOverlay = await sharp(overlayBuffer)
      .resize(params.zone.width, params.zone.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .png()
      .toBuffer();

    const processedOverlay = await this.applyEffect(resizedOverlay, params.effect ?? 'none');

    const outputFormat = (params.outputFormat ?? 'png') as keyof sharp.FormatEnum;
    const composed = await sharp(baseBuffer)
      .composite([{ input: processedOverlay, left: params.zone.x, top: params.zone.y }])
      .toFormat(outputFormat)
      .toBuffer();

    return composed;
  }

  /**
   * Compose final image: base product image + overlay(s) per zone with effects.
   */
  async compose(params: ComposeParams): Promise<Buffer> {
    const { baseImage, generatedOverlay, customizationZones, customizations, outputFormat } = params;

    try {
      this.logger.log('Composing final image with base + overlay(s)...');

      if (!customizationZones?.length) {
        return sharp(baseImage)
          .toFormat(outputFormat as keyof sharp.FormatEnum)
          .toBuffer();
      }

      const _composites: Array<{ input: Buffer; left: number; top: number }> = [];
      let currentBase = baseImage;

      for (const zone of customizationZones) {
        const x = Math.round(Number(zone.positionX));
        const y = Math.round(Number(zone.positionY));
        const w = Math.max(1, Math.round(Number(zone.width)));
        const h = Math.max(1, Math.round(Number(zone.height)));

        const resizedOverlay = await sharp(generatedOverlay)
          .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .ensureAlpha()
          .png()
          .toBuffer();

        // Optional: apply perspective via sharp().warp() or .affine() when zone has rotation/skew
        const effect = this.getEffectForZone(zone, customizations);
        const processedOverlay = await this.applyEffect(resizedOverlay, effect);

        currentBase = await sharp(currentBase)
          .composite([{ input: processedOverlay, left: x, top: y }])
          .toBuffer();
      }

      const composed = await sharp(currentBase)
        .toFormat(outputFormat as keyof sharp.FormatEnum)
        .toBuffer();

      return composed;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Image composition failed: ${msg}`);
      throw new InternalServerErrorException(
        `Failed to compose image: ${msg}`,
      );
    }
  }

  /**
   * Crée une miniature de l'image
   */
  async createThumbnail(image: Buffer, width: number = 300, height: number = 300): Promise<Buffer> {
    try {
      return await sharp(image)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Thumbnail creation failed: ${msg}`);
      throw new InternalServerErrorException(`Failed to create thumbnail: ${msg}`);
    }
  }

  /**
   * Upload une image vers le stockage
   */
  async uploadImage(buffer: Buffer, key: string, contentType: string): Promise<string> {
    return this.storage.uploadBuffer(buffer, key, {
      contentType,
      bucket: 'generations',
    });
  }
}
