import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
// Canvas is an optional native dependency - gracefully handle missing builds
let createCanvas: typeof import('canvas').createCanvas;
let loadImage: typeof import('canvas').loadImage;
type CanvasRenderingContext2D = import('canvas').CanvasRenderingContext2D;
type CanvasTextAlign = import('canvas').CanvasTextAlign;
type Image = import('canvas').Image;
try {
  const canvasModule = require('canvas');
  createCanvas = canvasModule.createCanvas;
  loadImage = canvasModule.loadImage;
} catch {
  // Canvas native module not available - render features will be disabled
}
import sharp from 'sharp';
// Types from widget package (will be imported from shared types later)
interface DesignData {
  id: string;
  productId: string;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  layers: Layer[];
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

interface Layer {
  id: string;
  type: 'text' | 'image' | 'shape';
  position: { x: number; y: number };
  rotation: number;
  scale: { x: number; y: number };
  opacity: number;
  visible: boolean;
  locked: boolean;
  data: TextLayerData | ImageLayerData | ShapeLayerData;
}

interface TextLayerData {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: string;
  textAlign: string;
  lineHeight: number;
  letterSpacing: number;
}

interface ImageLayerData {
  src: string;
  originalSrc: string;
  width: number;
  height: number;
}

interface ShapeLayerData {
  shapeType: 'rectangle' | 'circle' | 'triangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
}

export interface PrintReadyRenderRequest {
  id: string;
  designId: string;
  productId: string;
  width: number; // mm
  height: number; // mm
  dpi?: number; // Default: 300
  format?: 'png' | 'jpg' | 'jpeg' | 'pdf';
  quality?: number; // 1-100, default: 95
  backgroundColor?: string;
  bleed?: number; // mm
}

export interface PrintReadyRenderResult {
  id: string;
  status: 'success' | 'failed' | 'processing';
  url?: string;
  thumbnailUrl?: string;
  metadata?: {
    width: number;
    height: number;
    dpi: number;
    format: string;
    size: number;
    renderTime: number;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class RenderPrintReadyService {
  private readonly logger = new Logger(RenderPrintReadyService.name);
  private readonly DEFAULT_DPI = 300;
  private readonly DEFAULT_QUALITY = 95;
  private readonly MM_TO_INCH = 0.0393701;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Convert mm to pixels at given DPI
   */
  private mmToPixels(mm: number, dpi: number): number {
    const inches = mm * this.MM_TO_INCH;
    return Math.round(inches * dpi);
  }

  /**
   * Load image from URL or base64
   */
  private async loadImageFromSource(src: string): Promise<Image> {
    try {
      // Check if it's a base64 data URL
      if (src.startsWith('data:')) {
        const base64Data = src.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        return await loadImage(buffer);
      }
      
      // Load from URL
      const response = await fetch(src);
      if (!response.ok) {
        throw new InternalServerErrorException(`Failed to load image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return await loadImage(buffer);
    } catch (error) {
      this.logger.error(`Failed to load image from ${src}:`, error);
      throw error;
    }
  }

  /**
   * Render text layer
   */
  private renderTextLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    dpi: number,
  ): void {
    const data = layer.data as TextLayerData;
    
    // Set font
    const fontSizePx = this.mmToPixels(data.fontSize / 10, dpi); // Convert from 0.1mm units
    const fontFamily = data.fontFamily || 'Arial';
    const fontWeight = data.fontWeight || 'normal';
    const fontStyle = data.fontStyle || 'normal';
    
    ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
    ctx.fillStyle = data.color || '#000000';
    ctx.textAlign = (data.textAlign || 'left') as CanvasTextAlign;
    ctx.textBaseline = 'top';
    ctx.globalAlpha = layer.opacity;
    
    // Handle line breaks
    const lines = data.content.split('\n');
    const lineHeight = fontSizePx * (data.lineHeight || 1.2);
    
    lines.forEach((line, index) => {
      const x = this.mmToPixels(layer.position.x / 10, dpi);
      const y = this.mmToPixels(layer.position.y / 10, dpi) + (index * lineHeight);
      ctx.fillText(line, x, y);
    });
  }

  /**
   * Render image layer
   */
  private async renderImageLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    dpi: number,
  ): Promise<void> {
    const data = layer.data as ImageLayerData;
    
    try {
      const img = await this.loadImageFromSource(data.src);
      
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      
      const x = this.mmToPixels(layer.position.x / 10, dpi);
      const y = this.mmToPixels(layer.position.y / 10, dpi);
      const width = this.mmToPixels(data.width / 10, dpi);
      const height = this.mmToPixels(data.height / 10, dpi);
      
      // Apply transformations
      ctx.translate(x + width / 2, y + height / 2);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale.x, layer.scale.y);
      
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
      ctx.restore();
    } catch (error) {
      this.logger.warn(`Failed to render image layer ${layer.id}:`, error);
      // Draw placeholder
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(
        this.mmToPixels(layer.position.x / 10, dpi),
        this.mmToPixels(layer.position.y / 10, dpi),
        this.mmToPixels(data.width / 10, dpi),
        this.mmToPixels(data.height / 10, dpi),
      );
    }
  }

  /**
   * Render shape layer
   */
  private renderShapeLayer(
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    dpi: number,
  ): void {
    const data = layer.data as ShapeLayerData;
    
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    
    const x = this.mmToPixels(layer.position.x / 10, dpi);
    const y = this.mmToPixels(layer.position.y / 10, dpi);
    
    ctx.translate(x, y);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale.x, layer.scale.y);
    
    ctx.fillStyle = data.fill || '#000000';
    ctx.strokeStyle = data.stroke || 'transparent';
    ctx.lineWidth = data.strokeWidth || 0;
    
    switch (data.shapeType) {
      case 'rectangle': {
        const width = this.mmToPixels(100 / 10, dpi); // Default 100mm
        const height = this.mmToPixels(100 / 10, dpi);
        const radius = data.cornerRadius 
          ? this.mmToPixels(data.cornerRadius / 10, dpi)
          : 0;
        
        if (radius > 0) {
          this.drawRoundedRect(ctx, 0, 0, width, height, radius);
        } else {
          ctx.fillRect(0, 0, width, height);
        }
        if (data.strokeWidth > 0) {
          ctx.strokeRect(0, 0, width, height);
        }
        break;
      }
      
      case 'circle': {
        const radius = this.mmToPixels(50 / 10, dpi); // Default 50mm radius
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
        ctx.fill();
        if (data.strokeWidth > 0) {
          ctx.stroke();
        }
        break;
      }
      
      case 'triangle': {
        const size = this.mmToPixels(100 / 10, dpi);
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        if (data.strokeWidth > 0) {
          ctx.stroke();
        }
        break;
      }
      
      default:
        this.logger.warn(`Unsupported shape type: ${data.shapeType}`);
    }
    
    ctx.restore();
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render design to print-ready image
   */
  async renderPrintReady(request: PrintReadyRenderRequest): Promise<PrintReadyRenderResult> {
    // Guard: canvas module must be available
    if (!createCanvas || !loadImage) {
      this.logger.error('Canvas native module not available - cannot render print-ready images. Install: pnpm add canvas');
      throw new InternalServerErrorException('Print rendering service unavailable (canvas module not installed)');
    }

    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting print-ready render for request ${request.id}`);
      
      const dpi = request.dpi || this.DEFAULT_DPI;
      const quality = request.quality || this.DEFAULT_QUALITY;
      const format = request.format || 'png';
      
      // Calculate canvas dimensions in pixels
      const widthPx = this.mmToPixels(request.width, dpi);
      const heightPx = this.mmToPixels(request.height, dpi);
      
      // Add bleed if specified
      const bleedPx = request.bleed ? this.mmToPixels(request.bleed, dpi) : 0;
      const canvasWidth = widthPx + (bleedPx * 2);
      const canvasHeight = heightPx + (bleedPx * 2);
      
      // Create canvas
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');
      
      // Set background
      ctx.fillStyle = request.backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Translate for bleed
      ctx.translate(bleedPx, bleedPx);
      
      // Get design data
      const designData = await this.getDesignData(request.designId);
      
      // Render layers
      for (const layer of designData.layers) {
        if (!layer.visible) continue;
        
        try {
          switch (layer.type) {
            case 'text':
              this.renderTextLayer(ctx, layer, dpi);
              break;
            case 'image':
              await this.renderImageLayer(ctx, layer, dpi);
              break;
            case 'shape':
              this.renderShapeLayer(ctx, layer, dpi);
              break;
            default:
              this.logger.warn(`Unsupported layer type: ${layer.type}`);
          }
        } catch (error) {
          this.logger.error(`Failed to render layer ${layer.id}:`, error);
          // Continue with other layers
        }
      }
      
      // Convert canvas to buffer
      let buffer: Buffer;
      if (format === 'png') {
        buffer = canvas.toBuffer('image/png');
        // Optimize PNG with sharp
        buffer = await sharp(buffer)
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      } else if (format === 'jpg' || format === 'jpeg') {
        buffer = canvas.toBuffer('image/jpeg', { quality: quality / 100 });
        // Optimize JPEG with sharp
        buffer = await sharp(buffer)
          .jpeg({ quality })
          .toBuffer();
      } else if (format === 'pdf') {
        // For PDF, use sharp to convert
        buffer = await sharp(canvas.toBuffer('image/png'))
          .toFormat('pdf')
          .toBuffer();
      } else {
        // Default to PNG
        buffer = canvas.toBuffer('image/png');
      }
      
      // Upload to S3
      const uploadResult = await this.uploadRender(buffer, request, format);
      
      // Create thumbnail
      const thumbnailUrl = await this.createThumbnail(buffer, request);
      
      const renderTime = Date.now() - startTime;
      
      const result: PrintReadyRenderResult = {
        id: request.id,
        status: 'success',
        url: uploadResult.url,
        thumbnailUrl,
        metadata: {
          width: request.width,
          height: request.height,
          dpi,
          format,
          size: buffer.length,
          renderTime,
        },
        createdAt: new Date(),
        completedAt: new Date(),
      };
      
      // Cache result
      await this.cache.setSimple(
        `print_ready_render:${request.id}`,
        JSON.stringify(result),
        3600,
      );
      
      this.logger.log(
        `Print-ready render completed for request ${request.id} in ${renderTime}ms`,
      );
      
      return result;
    } catch (error) {
      this.logger.error('Render failed', { error });
      
      return {
        id: request.id,
        status: 'failed',
        error: 'Render processing failed',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Get design data from database
   */
  private async getDesignData(designId: string): Promise<DesignData> {
    // Try cache first
    const cached = await this.cache.getSimple(`design:${designId}`);
    if (cached) {
      return JSON.parse(cached as string) as DesignData;
    }
    
    // Get from database
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      include: {
        layers: true,
      },
    });
    
    if (!design) {
      throw new NotFoundException(`Design not found: ${designId}`);
    }
    
    // Convert to DesignData format
    const designData: DesignData = {
      id: design.id,
      productId: design.productId,
      canvas: {
        width: design.canvasWidth || 800,
        height: design.canvasHeight || 600,
        backgroundColor: (design && typeof design === 'object' && 'backgroundColor' in design ? (design as { backgroundColor?: string }).backgroundColor : undefined) || '#ffffff',
      },
      layers: design.layers.map((layer) => ({
        id: layer.id,
        type: layer.type as 'text' | 'image' | 'shape',
        position: { x: layer.x, y: layer.y },
        rotation: layer.rotation || 0,
        scale: { x: layer.scaleX || 1, y: layer.scaleY || 1 },
        opacity: layer.opacity || 1,
        visible: layer.visible ?? true,
        locked: layer.locked ?? false,
        data: layer.data as unknown as TextLayerData | ImageLayerData | ShapeLayerData,
      })),
      metadata: {
        createdAt: design.createdAt.toISOString(),
        updatedAt: design.updatedAt.toISOString(),
      },
    };
    
    // Cache for 1 hour
    await this.cache.setSimple(
      `design:${designId}`,
      JSON.stringify(designData),
      3600,
    );
    
    return designData;
  }

  /**
   * Upload render to S3
   */
  private async uploadRender(
    buffer: Buffer,
    request: PrintReadyRenderRequest,
    format: string,
  ): Promise<{ url: string; size: number }> {
    const filename = `renders/print-ready/${request.id}.${format}`;
    
    const contentType: string = format === 'pdf' ? 'application/pdf' : format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
    const url = await this.storageService.uploadBuffer(
      buffer,
      filename,
      {
        contentType,
        metadata: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      },
    );
    
    return { url, size: buffer.length };
  }

  /**
   * Create thumbnail
   */
  private async createThumbnail(
    buffer: Buffer,
    request: PrintReadyRenderRequest,
  ): Promise<string> {
    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    
    const filename = `renders/print-ready/${request.id}_thumb.png`;
    
    return await this.storageService.uploadBuffer(
      thumbnailBuffer,
      filename,
      {
        contentType: 'image/png',
        metadata: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      },
    );
  }
}

