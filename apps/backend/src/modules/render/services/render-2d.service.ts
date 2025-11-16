import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { S3Service } from '@/libs/s3/s3.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import * as sharp from 'sharp';
import {
  RenderRequest,
  RenderOptions,
  RenderResult,
  RenderValidationResult,
  RenderDesignData,
  RenderImageZone,
  RenderTextZone,
  RenderColorZone,
  RenderEffect,
  RenderZone,
} from '../interfaces/render.interface';
import { mapDesignRecord } from '../utils/render-data.mapper';

@Injectable()
export class Render2DService {
  private readonly logger = new Logger(Render2DService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly cache: SmartCacheService,
  ) {}


  /**
   * Rend un design 2D
   */
  async render2D(request: RenderRequest): Promise<RenderResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting 2D render for request ${request.id}`);
      
      // Valider la requête
      const validation = await this.validateRenderRequest(request);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Récupérer les données du design
      const designData = await this.getDesignData(request.productId, request.designId);
      
      // Créer le canvas
      const canvas = await this.createCanvas(request.options);
      
      // Appliquer les éléments du design
      const processedCanvas = await this.applyDesignElements(canvas, designData, request.options);
      
      // Finaliser le rendu
      const finalImage = await this.finalizeRender(processedCanvas, request.options);
      
      // Uploader vers S3
      const uploadResult = await this.uploadRender(finalImage, request);
      
      // Créer la thumbnail
      const thumbnailUrl = await this.createThumbnail(finalImage, request);
      
      const renderTime = Date.now() - startTime;
      
      const result: RenderResult = {
        id: request.id,
        status: 'success',
        url: uploadResult.url,
        thumbnailUrl,
        metadata: {
          width: request.options.width,
          height: request.options.height,
          format: request.options.format || 'png',
          size: uploadResult.size,
          renderTime,
          quality: request.options.quality || 'standard',
        },
        createdAt: new Date(),
        completedAt: new Date(),
      };

      // Mettre en cache le résultat
      await this.cache.setSimple(`render_result:${request.id}`, result, 3600);
      
      this.logger.log(`2D render completed for request ${request.id} in ${renderTime}ms`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`2D render failed for request ${request.id}: ${errorMessage}`);
      
      return {
        id: request.id,
        status: 'failed',
        error: errorMessage,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Valide une requête de rendu
   */
  private async validateRenderRequest(request: RenderRequest): Promise<RenderValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Vérifier les dimensions
    if (request.options.width <= 0 || request.options.height <= 0) {
      errors.push('Dimensions must be positive');
    }

    if (request.options.width > 8000 || request.options.height > 8000) {
      warnings.push('Very large dimensions may cause performance issues');
      suggestions.push('Consider reducing dimensions or using a lower quality setting');
    }

    // Vérifier le format
    const supportedFormats = ['png', 'jpg', 'webp', 'svg'];
    if (request.options.format && !supportedFormats.includes(request.options.format)) {
      errors.push(`Unsupported format: ${request.options.format}`);
    }

    // Vérifier la qualité
    const supportedQualities = ['draft', 'standard', 'high', 'ultra'];
    if (request.options.quality && !supportedQualities.includes(request.options.quality)) {
      errors.push(`Unsupported quality: ${request.options.quality}`);
    }

    // Vérifier le DPI
    if (request.options.dpi && (request.options.dpi < 72 || request.options.dpi > 300)) {
      warnings.push('DPI outside recommended range (72-300)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Récupère les données du design
   */
  private async getDesignData(productId: string, designId?: string): Promise<RenderDesignData> {
    if (designId) {
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
        select: {
          optionsJson: true,
          assets: {
            select: {
              id: true,
              url: true,
              type: true,
              format: true,
              size: true,
              width: true,
              height: true,
              metadata: true,
            },
          },
        },
      });

      if (!design) {
        throw new Error(`Design ${designId} not found`);
      }

      return mapDesignRecord({
        optionsJson: design.optionsJson,
        assets: design.assets,
      });
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        baseAssetUrl: true,
        images: true,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return {
      baseAsset: product.baseAssetUrl ?? undefined,
      images: product.images ?? undefined,
    };
  }

  /**
   * Crée un canvas de base
   */
  private async createCanvas(options: RenderOptions): Promise<sharp.Sharp> {
    const { width, height, backgroundColor = '#ffffff', dpi = 72 } = options;
    
    // Créer un canvas vide
    const canvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: backgroundColor,
      },
    });

    // Appliquer le DPI si spécifié
    if (dpi !== 72) {
      canvas.withMetadata({ density: dpi });
    }

    return canvas;
  }

  /**
   * Applique les éléments du design au canvas
   */
  private async applyDesignElements(
    canvas: sharp.Sharp,
    designData: RenderDesignData,
    options: RenderOptions
  ): Promise<sharp.Sharp> {
    let processedCanvas = canvas;

    // Appliquer l'image de base si disponible
    if (designData.baseAsset) {
      processedCanvas = await this.applyBaseImage(processedCanvas, designData.baseAsset, options);
    }

    // Appliquer les zones personnalisées
    if (designData.options?.zones) {
      processedCanvas = await this.applyZones(processedCanvas, designData.options.zones, options);
    }

    // Appliquer les effets
    if (designData.options?.effects) {
      processedCanvas = await this.applyEffects(processedCanvas, designData.options.effects);
    }

    return processedCanvas;
  }

  /**
   * Applique l'image de base
   */
  private async applyBaseImage(
    canvas: sharp.Sharp,
    baseAssetUrl: string,
    options: RenderOptions
  ): Promise<sharp.Sharp> {
    try {
      // Télécharger l'image de base
      const baseImage = await this.downloadAsset(baseAssetUrl);
      
      // Redimensionner l'image de base pour s'adapter au canvas
      const resizedBase = await sharp(baseImage)
        .resize(options.width, options.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toBuffer();

      // Composer l'image de base avec le canvas
      return canvas.composite([{
        input: resizedBase,
        blend: 'over',
      }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to apply base image: ${errorMessage}`);
      return canvas;
    }
  }

  /**
   * Applique les zones personnalisées
   */
  private async applyZones(
    canvas: sharp.Sharp,
    zones: Record<string, RenderZone>,
    options: RenderOptions
  ): Promise<sharp.Sharp> {
    let processedCanvas = canvas;

    for (const [zoneId, zoneData] of Object.entries(zones)) {
      try {
        processedCanvas = await this.applyZone(processedCanvas, zoneId, zoneData, options);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to apply zone ${zoneId}: ${errorMessage}`);
      }
    }

    return processedCanvas;
  }

  /**
   * Applique une zone spécifique
   */
  private async applyZone(
    canvas: sharp.Sharp,
    _zoneId: string,
    zoneData: RenderZone,
    options: RenderOptions
  ): Promise<sharp.Sharp> {
    switch (zoneData.type) {
      case 'image':
        return this.applyImageZone(canvas, zoneData);
      case 'text':
        return this.applyTextZone(canvas, zoneData);
      case 'color':
        return this.applyColorZone(canvas, zoneData);
    }

    return canvas;
  }

  /**
   * Applique une zone image
   */
  private async applyImageZone(canvas: sharp.Sharp, zoneData: RenderImageZone): Promise<sharp.Sharp> {
    try {
      const imageBuffer = await this.downloadAsset(zoneData.imageUrl);
      
      const positionedImage = await sharp(imageBuffer)
        .resize(zoneData.width ?? 200, zoneData.height ?? 200, {
          fit: zoneData.fit ?? 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      return canvas.composite([{
        input: positionedImage,
        left: zoneData.x ?? 0,
        top: zoneData.y ?? 0,
        blend: zoneData.blend ?? 'over',
      }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to apply image zone: ${errorMessage}`);
      return canvas;
    }
  }

  /**
   * Applique une zone texte
   */
  private async applyTextZone(canvas: sharp.Sharp, zoneData: RenderTextZone): Promise<sharp.Sharp> {
    // Pour le texte, nous créons une image SVG temporaire
    const svgText = this.createTextSVG(zoneData);
    
    try {
      const textBuffer = await sharp(Buffer.from(svgText))
        .png()
        .toBuffer();

      return canvas.composite([{
        input: textBuffer,
        left: zoneData.x ?? 0,
        top: zoneData.y ?? 0,
        blend: 'over',
      }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to apply text zone: ${errorMessage}`);
      return canvas;
    }
  }

  /**
   * Applique une zone couleur
   */
  private async applyColorZone(canvas: sharp.Sharp, zoneData: RenderColorZone): Promise<sharp.Sharp> {
    const colorOverlay = await sharp({
      create: {
        width: zoneData.width ?? 100,
        height: zoneData.height ?? 100,
        channels: 4,
        background: zoneData.color ?? '#000000',
      },
    }).png().toBuffer();

    return canvas.composite([{
      input: colorOverlay,
      left: zoneData.x ?? 0,
      top: zoneData.y ?? 0,
      blend: zoneData.blend ?? 'over',
    }]);
  }

  /**
   * Applique les effets
   */
  private async applyEffects(canvas: sharp.Sharp, effects: RenderEffect[]): Promise<sharp.Sharp> {
    let processedCanvas = canvas;

    for (const effect of effects) {
      switch (effect.type) {
        case 'blur':
          processedCanvas = processedCanvas.blur(effect.intensity ?? effect.value ?? 1);
          break;
        case 'sharpen':
          processedCanvas = processedCanvas.sharpen();
          break;
        case 'brightness':
          processedCanvas = processedCanvas.modulate({
            brightness: effect.value ?? effect.intensity ?? 1,
          });
          break;
        case 'contrast':
          processedCanvas = processedCanvas.modulate({
            saturation: effect.value ?? effect.intensity ?? 1,
          });
          break;
        case 'hue':
          processedCanvas = processedCanvas.modulate({
            hue: effect.value ?? effect.intensity ?? 0,
          });
          break;
        case 'grayscale':
          processedCanvas = processedCanvas.grayscale();
          break;
        case 'sepia':
          // processedCanvas = processedCanvas.sepia(); // Commenté car pas dans Sharp
          break;
        case 'vintage':
          processedCanvas = processedCanvas.modulate({
            brightness: 0.8,
            saturation: 0.7,
            hue: 10,
          }).sharpen();
          break;
      }
    }

    return processedCanvas;
  }

  /**
   * Finalise le rendu
   */
  private async finalizeRender(canvas: sharp.Sharp, options: RenderOptions): Promise<Buffer> {
    const format = options.format || 'png';
    const quality = this.getQualityValue(options.quality);

    switch (format) {
      case 'jpg':
      case 'jpeg':
        return canvas
          .jpeg({ quality, progressive: true })
          .toBuffer();
      
      case 'webp':
        return canvas
          .webp({ quality })
          .toBuffer();
      
      case 'svg':
        // Pour SVG, nous retournons le canvas PNG car Sharp ne génère pas de SVG
        return canvas
          .png({ quality: 100 })
          .toBuffer();
      
      default:
        return canvas
          .png({ quality })
          .toBuffer();
    }
  }

  /**
   * Obtient la valeur de qualité
   */
  private getQualityValue(quality?: string): number {
    switch (quality) {
      case 'draft': return 60;
      case 'standard': return 80;
      case 'high': return 90;
      case 'ultra': return 95;
      default: return 80;
    }
  }

  /**
   * Upload le rendu vers S3
   */
  private async uploadRender(imageBuffer: Buffer, request: RenderRequest): Promise<{ url: string; size: number }> {
    const filename = `renders/2d/${request.id}.${request.options.format || 'png'}`;
    
    const url = await this.s3Service.uploadBuffer(
      imageBuffer,
      filename,
      {
        contentType: this.getContentType(request.options.format || 'png'),
        metadata: {
          renderId: request.id,
          type: '2d-render',
          quality: request.options.quality || 'standard',
        },
      }
    );

    return {
      url,
      size: imageBuffer.length,
    };
  }

  /**
   * Crée une thumbnail
   */
  private async createThumbnail(imageBuffer: Buffer, request: RenderRequest): Promise<string> {
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    const filename = `thumbnails/2d/${request.id}.png`;
    
    const url = await this.s3Service.uploadBuffer(
      thumbnailBuffer,
      filename,
      {
        contentType: 'image/png',
        metadata: {
          renderId: request.id,
          type: '2d-thumbnail',
        },
      }
    );

    return url;
  }

  /**
   * Télécharge un asset
   */
  private async downloadAsset(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download asset: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Crée un SVG pour le texte
   */
  private createTextSVG(zoneData: RenderTextZone): string {
    const text = zoneData.text || 'Sample Text';
    const font = zoneData.font || 'Arial';
    const fontSize = zoneData.fontSize ?? 16;
    const color = zoneData.color || '#000000';
    const width = zoneData.width ?? 200;
    const height = zoneData.height ?? 50;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" font-family="${font}" font-size="${fontSize}" fill="${color}" 
              text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;
  }

  /**
   * Obtient le type de contenu
   */
  private getContentType(format: string): string {
    switch (format) {
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      case 'svg': return 'image/svg+xml';
      default: return 'image/png';
    }
  }
}


