import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import * as sharp from 'sharp';

interface RenderOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  backgroundColor?: string;
}

interface CanvasData {
  objects?: Array<{
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    src?: string;
    [key: string]: unknown;
  }>;
  background?: string;
  width?: number;
  height?: number;
}

@Injectable()
export class CustomizerRenderService {
  private readonly logger = new Logger(CustomizerRenderService.name);

  /**
   * Render canvas data to image buffer
   * Note: This is a simplified implementation. In production, you would use
   * a proper canvas rendering library like node-canvas or Konva server-side
   */
  async renderToImage(
    canvasData: CanvasData,
    options: RenderOptions = {},
  ): Promise<Buffer> {
    const width = options.width || canvasData.width || 800;
    const height = options.height || canvasData.height || 800;
    const format = options.format || 'png';
    const backgroundColor = options.backgroundColor || canvasData.background || '#ffffff';

    try {
      // Create base image with background
      const image = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: this.hexToRgba(backgroundColor),
        },
      });

      // In a real implementation, you would:
      // 1. Load and composite each object from canvasData.objects
      // 2. Apply transformations (position, rotation, scale, etc.)
      // 3. Apply filters and effects
      // 4. Composite layers in correct order

      // For now, return a placeholder image
      // TODO: Implement full canvas rendering with Konva or node-canvas
      const output = await image
        .toFormat(format, {
          quality: options.quality || (format === 'jpeg' ? 90 : 100),
        })
        .toBuffer();

      this.logger.log(
        `Rendered image: ${width}x${height} ${format}`,
      );

      return output;
    } catch (error) {
      this.logger.error(`Failed to render image: ${error}`);
      throw new BadRequestException(
        `Failed to render image: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Generate thumbnail from image buffer
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    size: { width: number; height: number } = { width: 200, height: 200 },
  ): Promise<Buffer> {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();

      this.logger.log(
        `Generated thumbnail: ${size.width}x${size.height}`,
      );

      return thumbnail;
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail: ${error}`);
      throw new BadRequestException(
        `Failed to generate thumbnail: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Convert hex color to RGBA
   */
  private hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const alpha = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

    return { r, g, b, alpha };
  }
}
