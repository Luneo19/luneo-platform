import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import type { Sharp } from 'sharp';
import { 
  RenderRequest, 
  RenderOptions, 
  RenderResult,
  RenderValidationResult
} from '../interfaces/render.interface';
import { JsonValue } from '@/common/types/utility-types';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { UsageTrackingService } from '@/modules/usage-billing/services/usage-tracking.service';

@Injectable()
export class Render2DService {
  private readonly logger = new Logger(Render2DService.name);
  private sharpModule: typeof import('sharp') | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: SmartCacheService,
    private readonly quotasService: QuotasService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  /**
   * Lazy load sharp module to reduce cold start time
   */
  private async getSharp(): Promise<typeof import('sharp')> {
    if (!this.sharpModule) {
      const sharpImport = await import('sharp') as typeof import('sharp') & { default?: typeof import('sharp') };
      this.sharpModule = (sharpImport.default ?? sharpImport) as typeof import('sharp');
    }
    return this.sharpModule;
  }

  /**
   * Rend un design 2D
   */
  async render2D(request: RenderRequest): Promise<RenderResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting 2D render for request ${request.id}`);

      const brandId = await this.getBrandIdFromProduct(request.productId);
      await this.quotasService.enforceQuota(brandId, 'renders_2d');
      
      // Valider la requête
      const validation = await this.validateRenderRequest(request);
      if (!validation.isValid) {
        throw new BadRequestException(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Récupérer les données du design
      const designData = await this.getDesignData(request.productId, request.designId);
      
      // Créer le canvas
      const canvas = await this.createCanvas(request.options);
      
      // Appliquer les éléments du design
      const processedCanvas = await this.applyDesignElements(canvas, designData as unknown as Record<string, JsonValue>, request.options);
      
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
        url: typeof uploadResult === 'string' ? uploadResult : uploadResult.url,
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
      await this.cache.setSimple(`render_result:${request.id}`, JSON.stringify(result), 3600);

      await this.usageTrackingService.trackRender2D(
        brandId,
        request.designId ?? request.id,
        request.options?.format ?? 'png',
      );
      
      this.logger.log(`2D render completed for request ${request.id} in ${renderTime}ms`);
      
      return result;
    } catch (error) {
      this.logger.error(`2D render failed for request ${request.id}:`, error instanceof Error ? error.stack : String(error));
      return {
        id: request.id,
        status: 'failed',
        error: 'Render failed',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Récupère le brandId à partir du productId
   */
  private async getBrandIdFromProduct(productId: string): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { brandId: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return product.brandId;
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
  private async getDesignData(productId: string, designId?: string): Promise<{
    options: RenderOptions;
    assets?: Array<{ url: string; type: string; format: string }>;
    baseAsset?: string;
    images?: string[];
  }> {
    if (designId) {
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
        select: {
          options: true,
          assets: {
            select: {
              url: true,
              type: true,
              format: true,
            },
          },
        },
      });
      
      if (!design) {
        throw new NotFoundException(`Design ${designId} not found`);
      }
      
      return {
        options: (design.options as unknown as RenderOptions | null) || { width: 800, height: 600 },
        assets: design.assets,
      };
    }

    // Récupérer le produit par défaut
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        baseAssetUrl: true,
        images: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return {
      baseAsset: product.baseAssetUrl || undefined,
      images: product.images,
      options: { width: 800, height: 600 } as RenderOptions,
    };
  }

  /**
   * Crée un canvas de base
   */
  private async createCanvas(options: RenderOptions): Promise<Sharp> {
    const { width, height, backgroundColor = '#ffffff', dpi = 72 } = options;
    const sharp = await this.getSharp();
    
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
    canvas: Sharp,
    designData: Record<string, JsonValue>,
    options: RenderOptions
  ): Promise<Sharp> {
    let processedCanvas = canvas;

    // Appliquer l'image de base si disponible
    const baseAsset = designData.baseAsset;
    if (baseAsset && typeof baseAsset === 'string') {
      processedCanvas = await this.applyBaseImage(processedCanvas, baseAsset, options);
    }

    // Appliquer les zones personnalisées
    const designOptions = designData.options as unknown as (RenderOptions & { zones?: Record<string, Record<string, JsonValue>>; effects?: Array<{ type: string; intensity?: number; value?: number }> }) | undefined;
    if (designOptions?.zones) {
      processedCanvas = await this.applyZones(processedCanvas, designOptions.zones, options);
    }

    // Appliquer les effets
    if (designOptions?.effects) {
      processedCanvas = await this.applyEffects(processedCanvas, designOptions.effects);
    }

    return processedCanvas;
  }

  /**
   * Applique l'image de base
   */
  private async applyBaseImage(
    canvas: Sharp,
    baseAssetUrl: string,
    options: RenderOptions
  ): Promise<Sharp> {
    try {
      const sharp = await this.getSharp();
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
      this.logger.warn(`Failed to apply base image: ${error.message}`);
      return canvas;
    }
  }

  /**
   * Applique les zones personnalisées
   */
  private async applyZones(
    canvas: Sharp,
    zones: Record<string, Record<string, JsonValue>>,
    options: RenderOptions
  ): Promise<Sharp> {
    let processedCanvas = canvas;

    for (const [zoneId, zoneData] of Object.entries(zones)) {
      try {
        processedCanvas = await this.applyZone(processedCanvas, zoneId, zoneData, options);
      } catch (error) {
        this.logger.warn(`Failed to apply zone ${zoneId}: ${error.message}`);
      }
    }

    return processedCanvas;
  }

  /**
   * Applique une zone spécifique
   */
  private async applyZone(
    canvas: Sharp,
    zoneId: string,
    zoneData: Record<string, JsonValue>,
    _options: RenderOptions
  ): Promise<Sharp> {
    if (zoneData.type === 'image' && zoneData.imageUrl) {
      return this.applyImageZone(canvas, zoneData);
    } else if (zoneData.type === 'text') {
      return this.applyTextZone(canvas, zoneData);
    } else if (zoneData.type === 'color') {
      return this.applyColorZone(canvas, zoneData);
    }

    return canvas;
  }

  /**
   * Applique une zone image
   */
  private async applyImageZone(canvas: Sharp, zoneData: Record<string, JsonValue>): Promise<Sharp> {
    try {
      const sharp = await this.getSharp();
      const imageUrl = typeof zoneData.imageUrl === 'string' ? zoneData.imageUrl : '';
      const imageBuffer = await this.downloadAsset(imageUrl);
      const width = typeof zoneData.width === 'number' ? zoneData.width : 200;
      const height = typeof zoneData.height === 'number' ? zoneData.height : 200;

      const positionedImage = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      const left = typeof zoneData.x === 'number' ? zoneData.x : 0;
      const top = typeof zoneData.y === 'number' ? zoneData.y : 0;
      return canvas.composite([{
        input: positionedImage,
        left,
        top,
        blend: 'over',
      }]);
    } catch (error) {
      this.logger.warn(`Failed to apply image zone: ${error instanceof Error ? error.message : String(error)}`);
      return canvas;
    }
  }

  /**
   * Applique une zone texte
   */
  private async applyTextZone(canvas: Sharp, zoneData: Record<string, JsonValue>): Promise<Sharp> {
    // Pour le texte, nous créons une image SVG temporaire
    const svgText = this.createTextSVG(zoneData);
    
    try {
      const sharp = await this.getSharp();
      const textBuffer = await sharp(Buffer.from(svgText))
        .png()
        .toBuffer();

      const left = typeof zoneData.x === 'number' ? zoneData.x : 0;
      const top = typeof zoneData.y === 'number' ? zoneData.y : 0;
      return canvas.composite([{
        input: textBuffer,
        left,
        top,
        blend: 'over',
      }]);
    } catch (error) {
      this.logger.warn(`Failed to apply text zone: ${error instanceof Error ? error.message : String(error)}`);
      return canvas;
    }
  }

  /**
   * Applique une zone couleur
   */
  private async applyColorZone(canvas: Sharp, zoneData: Record<string, JsonValue>): Promise<Sharp> {
    const sharp = await this.getSharp();
    const width = typeof zoneData.width === 'number' ? zoneData.width : 100;
    const height = typeof zoneData.height === 'number' ? zoneData.height : 100;
    const color = typeof zoneData.color === 'string' ? zoneData.color : '#000000';
    const blend = typeof zoneData.blend === 'string' ? zoneData.blend : 'over';
    const left = typeof zoneData.x === 'number' ? zoneData.x : 0;
    const top = typeof zoneData.y === 'number' ? zoneData.y : 0;

    const colorOverlay = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: color,
      },
    }).png().toBuffer();

    return canvas.composite([{
      input: colorOverlay,
      left,
      top,
      blend: blend as 'over',
    }]);
  }

  /**
   * Applique les effets
   */
  private async applyEffects(canvas: Sharp, effects: Array<{ type: string; intensity?: number; value?: number | string }>): Promise<Sharp> {
    let processedCanvas = canvas;

    for (const effect of effects) {
      switch (effect.type) {
        case 'blur':
          processedCanvas = processedCanvas.blur(effect.intensity || 1);
          break;
        case 'sharpen':
          processedCanvas = processedCanvas.sharpen();
          break;
        case 'brightness':
          processedCanvas = processedCanvas.modulate({
            brightness: typeof effect.value === 'number' ? effect.value : 1,
          });
          break;
        case 'contrast':
          processedCanvas = processedCanvas.modulate({
            saturation: typeof effect.value === 'number' ? effect.value : 1,
          });
          break;
        case 'hue':
          processedCanvas = processedCanvas.modulate({
            hue: typeof effect.value === 'number' ? effect.value : 0,
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
  private async finalizeRender(canvas: Sharp, options: RenderOptions): Promise<Buffer> {
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
    
    const uploadResult = await this.storageService.uploadBuffer(
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
      url: typeof uploadResult === 'string' ? uploadResult : (uploadResult as { url?: string })?.url ?? '',
      size: imageBuffer.length,
    };
  }

  /**
   * Crée une thumbnail
   */
  private async createThumbnail(imageBuffer: Buffer, request: RenderRequest): Promise<string> {
    const sharp = await this.getSharp();
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    const filename = `thumbnails/2d/${request.id}.png`;
    
    const uploadResult = await this.storageService.uploadBuffer(
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

    return uploadResult as string;
  }

  /**
   * Télécharge un asset
   */
  private async downloadAsset(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new InternalServerErrorException(`Failed to download asset: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Crée un SVG pour le texte
   */
  private createTextSVG(zoneData: Record<string, JsonValue>): string {
    const text = typeof zoneData.text === 'string' ? zoneData.text : 'Sample Text';
    const font = typeof zoneData.font === 'string' ? zoneData.font : 'Arial';
    const fontSize = typeof zoneData.fontSize === 'number' ? zoneData.fontSize : 16;
    const color = typeof zoneData.color === 'string' ? zoneData.color : '#000000';
    const width = typeof zoneData.width === 'number' ? zoneData.width : 200;
    const height = typeof zoneData.height === 'number' ? zoneData.height : 50;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" font-family="${font}" font-size="${fontSize}" fill="${color}"
              text-anchor="middle" dominant-baseline="middle">
          ${String(text)}
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

  /**
   * Obtient les métriques de rendu
   */
  async getRenderMetrics(): Promise<{ totalRenders: number; successfulRenders: number; failedRenders: number; averageRenderTime?: number }> {
    const cacheKey = 'render_metrics:2d';
    
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as { totalRenders: number; successfulRenders: number; failedRenders: number; averageRenderTime?: number };
    }

    try {
      // Statistiques des 24 dernières heures
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const totalRenders = await this.prisma.design.count({
        where: {
          createdAt: { gte: yesterday },
        },
      });

      const successfulRenders = await this.prisma.design.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: yesterday },
        },
      });

      const failedRenders = await this.prisma.design.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: yesterday },
        },
      });

      const metrics = {
        totalRenders,
        successfulRenders,
        failedRenders,
        successRate: totalRenders > 0 ? (successfulRenders / totalRenders) * 100 : 0,
        averageRenderTime: 1500, // Simulation
        lastUpdated: new Date(),
      };

      // Mettre en cache pour 5 minutes
      await this.cache.setSimple(cacheKey, JSON.stringify(metrics), 300);
      
      return metrics;
    } catch (error) {
      this.logger.error('Error getting render metrics:', error);
      throw error;
    }
  }
}


