import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

export interface MarketingRenderRequest {
  designId: string;
  productId: string;
  type: 'packshot' | 'lifestyle' | 'turntable' | 'detail';
  options?: {
    background?: 'white' | 'transparent' | 'gradient' | 'custom';
    lighting?: 'studio' | 'natural' | 'dramatic' | 'soft';
    angles?: number[]; // Angles de vue (degrés)
    resolution?: { width: number; height: number };
    format?: 'png' | 'jpg' | 'webp';
  };
}

export interface MarketingRenderResult {
  images: Array<{
    url: string;
    type: string;
    angle?: number;
    width: number;
    height: number;
  }>;
  videoUrl?: string; // Pour turntable
  metadata: {
    renderTime: number;
    format: string;
    totalSize: number;
  };
}

@Injectable()
export class MarketingRenderService {
  private readonly logger = new Logger(MarketingRenderService.name);

  // Presets de lighting studio
  private readonly LIGHTING_PRESETS = {
    studio: {
      ambient: { intensity: 0.4, color: 0xffffff },
      directional: [
        { position: { x: 5, y: 5, z: 5 }, intensity: 1.0, color: 0xffffff },
        { position: { x: -5, y: 3, z: -5 }, intensity: 0.3, color: 0xffffff },
      ],
    },
    natural: {
      ambient: { intensity: 0.6, color: 0xffffff },
      directional: [
        { position: { x: 2, y: 10, z: 2 }, intensity: 0.8, color: 0xfff5e1 },
      ],
    },
    dramatic: {
      ambient: { intensity: 0.2, color: 0xffffff },
      directional: [
        { position: { x: 10, y: 5, z: 0 }, intensity: 1.5, color: 0xffffff },
        { position: { x: -5, y: 2, z: -5 }, intensity: 0.2, color: 0x8888ff },
      ],
    },
    soft: {
      ambient: { intensity: 0.5, color: 0xffffff },
      directional: [
        { position: { x: 3, y: 4, z: 3 }, intensity: 0.6, color: 0xffffff },
        { position: { x: -3, y: 2, z: -3 }, intensity: 0.4, color: 0xffffff },
      ],
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Génère un rendu marketing
   */
  async render(request: MarketingRenderRequest): Promise<MarketingRenderResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting marketing render for design ${request.designId}`, {
        type: request.type,
      });

      // Récupérer le modèle 3D
      const model = await this.getModel3D(request.designId, request.productId);

      if (!model) {
        throw new Error(`3D model not found for design ${request.designId}`);
      }

      const options = request.options || {};
      const lighting = options.lighting || 'studio';
      const background = options.background || 'white';
      const resolution = options.resolution || { width: 2048, height: 2048 };

      let images: MarketingRenderResult['images'] = [];

      switch (request.type) {
        case 'packshot':
          images = await this.renderPackshot(model, {
            background,
            lighting,
            resolution,
            format: options.format || 'png',
          });
          break;

        case 'lifestyle':
          images = await this.renderLifestyle(model, {
            background,
            lighting,
            resolution,
            format: options.format || 'png',
          });
          break;

        case 'turntable':
          const turntableResult = await this.renderTurntable(model, {
            lighting,
            resolution,
            angles: options.angles || [0, 45, 90, 135, 180, 225, 270, 315],
          });
          images = turntableResult.images;
          // TODO: Générer vidéo turntable
          break;

        case 'detail':
          images = await this.renderDetail(model, {
            lighting,
            resolution,
            format: options.format || 'png',
          });
          break;
      }

      const renderTime = Date.now() - startTime;

      // Uploader les images
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          const url = await this.uploadImage(img.url, request.designId, img.type);
          return { ...img, url };
        }),
      );

      return {
        images: uploadedImages,
        metadata: {
          renderTime,
          format: options.format || 'png',
          totalSize: uploadedImages.reduce((sum, img) => sum + (img.width * img.height), 0),
        },
      };
    } catch (error) {
      this.logger.error(`Marketing render failed for design ${request.designId}:`, error);
      throw error;
    }
  }

  /**
   * Rend un packshot (fond blanc, produit centré)
   */
  private async renderPackshot(
    model: any,
    options: {
      background: string;
      lighting: string;
      resolution: { width: number; height: number };
      format: string;
    },
  ): Promise<MarketingRenderResult['images']> {
    // TODO: Implémenter rendu réel avec Three.js serveur ou Blender
    this.logger.debug('Rendering packshot', options);

    // Simulation
    return [
      {
        url: `packshot_${Date.now()}.${options.format}`,
        type: 'packshot',
        width: options.resolution.width,
        height: options.resolution.height,
      },
    ];
  }

  /**
   * Rend un lifestyle (contexte, ambiance)
   */
  private async renderLifestyle(
    model: any,
    options: {
      background: string;
      lighting: string;
      resolution: { width: number; height: number };
      format: string;
    },
  ): Promise<MarketingRenderResult['images']> {
    // TODO: Implémenter rendu lifestyle (peut utiliser IA pour générer contexte)
    this.logger.debug('Rendering lifestyle', options);

    return [
      {
        url: `lifestyle_${Date.now()}.${options.format}`,
        type: 'lifestyle',
        width: options.resolution.width,
        height: options.resolution.height,
      },
    ];
  }

  /**
   * Rend un turntable (rotation 360°)
   */
  private async renderTurntable(
    model: any,
    options: {
      lighting: string;
      resolution: { width: number; height: number };
      angles: number[];
    },
  ): Promise<{ images: MarketingRenderResult['images'] }> {
    // TODO: Générer images à chaque angle, puis créer vidéo
    this.logger.debug('Rendering turntable', options);

    const images = options.angles.map((angle) => ({
      url: `turntable_${angle}.png`,
      type: 'turntable',
      angle,
      width: options.resolution.width,
      height: options.resolution.height,
    }));

    return { images };
  }

  /**
   * Rend des détails (gros plans)
   */
  private async renderDetail(
    model: any,
    options: {
      lighting: string;
      resolution: { width: number; height: number };
      format: string;
    },
  ): Promise<MarketingRenderResult['images']> {
    // TODO: Rendu gros plans de détails spécifiques
    this.logger.debug('Rendering detail shots', options);

    return [
      {
        url: `detail_${Date.now()}.${options.format}`,
        type: 'detail',
        width: options.resolution.width,
        height: options.resolution.height,
      },
    ];
  }

  /**
   * Récupère le modèle 3D
   */
  private async getModel3D(designId: string, productId: string): Promise<any> {
    // Récupérer depuis Asset ou Product
    const asset = await this.prisma.asset.findFirst({
      where: {
        designId,
        type: 'model',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (asset) {
      return { url: asset.url, format: asset.format };
    }

    // Fallback: récupérer depuis Product
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { model3dUrl: true },
    });

    return product?.model3dUrl ? { url: product.model3dUrl } : null;
  }

  /**
   * Upload une image rendue
   */
  private async uploadImage(
    localPath: string,
    designId: string,
    type: string,
  ): Promise<string> {
    // TODO: Upload réel vers Cloudinary/S3
    return `https://storage.example.com/renders/${designId}/${type}_${Date.now()}.png`;
  }
}
































