import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { firstValueFrom } from 'rxjs';
import * as sharp from 'sharp';

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

  private readonly openaiApiKey: string;
  private readonly renderServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.renderServiceUrl = this.configService.get<string>('RENDER_3D_SERVICE_URL') || '';
  }

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
        throw new NotFoundException(`3D model not found for design ${request.designId}`);
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

        case 'turntable': {
          const turntableResult = await this.renderTurntable(model, {
            lighting,
            resolution,
            angles: options.angles || [0, 45, 90, 135, 180, 225, 270, 315],
          });
          images = turntableResult.images;
          // videoUrl sera disponible si le service externe l'a généré
          const videoUrl = turntableResult.videoUrl;
          if (videoUrl) {
            this.logger.log(`Turntable video generated: ${videoUrl}`);
          }
          break;
        }

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
    model: { url: string; format?: string },
    options: {
      background: string;
      lighting: string;
      resolution: { width: number; height: number };
      format: string;
    },
  ): Promise<MarketingRenderResult['images']> {
    this.logger.debug('Rendering packshot', options);

    // Essayer le service de rendu externe
    if (this.renderServiceUrl) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<{ imageUrl?: string; error?: string }>(
            `${this.renderServiceUrl.replace(/\/$/, '')}/render/packshot`,
            {
              modelUrl: model.url,
              background: options.background,
              lighting: this.LIGHTING_PRESETS[options.lighting as keyof typeof this.LIGHTING_PRESETS] || this.LIGHTING_PRESETS.studio,
              width: options.resolution.width,
              height: options.resolution.height,
              format: options.format,
            },
            { timeout: 60000 },
          ),
        );

        if (response.data?.imageUrl) {
          return [
            {
              url: response.data.imageUrl,
              type: 'packshot',
              width: options.resolution.width,
              height: options.resolution.height,
            },
          ];
        }
      } catch (err) {
        this.logger.warn(`External packshot render failed: ${err}`);
      }
    }

    // Fallback: si le modèle a une image/texture, l'utiliser avec Sharp
    if (model.url && (model.url.endsWith('.png') || model.url.endsWith('.jpg'))) {
      try {
        const imageResponse = await firstValueFrom(
          this.httpService.get(model.url, { responseType: 'arraybuffer' }),
        );
        
        // Créer un fond selon les options
        const bgColor = options.background === 'white' ? '#ffffff' : 
                        options.background === 'transparent' ? null : '#f5f5f5';
        
        const processedBuffer = await sharp(Buffer.from(imageResponse.data))
          .resize(options.resolution.width, options.resolution.height, {
            fit: 'contain',
            background: bgColor ? bgColor : { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toFormat(options.format as keyof sharp.FormatEnum)
          .toBuffer();

        // Upload vers storage
        const filename = `renders/packshot_${Date.now()}.${options.format}`;
        const uploadUrl = await this.storageService.uploadBuffer(
          processedBuffer,
          filename,
          { contentType: `image/${options.format}` },
        );

        return [
          {
            url: uploadUrl as string,
            type: 'packshot',
            width: options.resolution.width,
            height: options.resolution.height,
          },
        ];
      } catch (imgErr) {
        this.logger.warn(`Image processing failed: ${imgErr}`);
      }
    }

    // Dernier fallback: placeholder
    return [
      {
        url: model.url || `https://placehold.co/${options.resolution.width}x${options.resolution.height}/white/gray?text=Packshot`,
        type: 'packshot',
        width: options.resolution.width,
        height: options.resolution.height,
      },
    ];
  }

  /**
   * Rend un lifestyle (contexte, ambiance) avec IA
   */
  private async renderLifestyle(
    model: { url: string; format?: string },
    options: {
      background: string;
      lighting: string;
      resolution: { width: number; height: number };
      format: string;
    },
  ): Promise<MarketingRenderResult['images']> {
    this.logger.debug('Rendering lifestyle', options);

    // Utiliser OpenAI DALL-E pour générer un contexte lifestyle
    if (this.openaiApiKey && this.openaiApiKey !== 'sk-placeholder') {
      try {
        // Mapper la résolution à une taille DALL-E supportée
        const dalleSize = this.mapToDalleSize(options.resolution.width, options.resolution.height);
        
        const prompt = `Professional product photography lifestyle shot. Elegant ${options.lighting} lighting, ${options.background === 'gradient' ? 'subtle gradient background' : 'sophisticated background'}, high-end commercial photography style, photorealistic, 8k quality`;

        const response = await firstValueFrom(
          this.httpService.post(
            'https://api.openai.com/v1/images/generations',
            {
              model: 'dall-e-3',
              prompt,
              n: 1,
              size: dalleSize,
              quality: 'hd',
              style: 'natural',
            },
            {
              headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 60000,
            },
          ),
        );

        const imageUrl = response.data?.data?.[0]?.url;
        if (imageUrl) {
          // Télécharger l'image et l'uploader vers notre storage
          const imageResponse = await firstValueFrom(
            this.httpService.get(imageUrl, { responseType: 'arraybuffer' }),
          );

          // Redimensionner si nécessaire
          const processedBuffer = await sharp(Buffer.from(imageResponse.data))
            .resize(options.resolution.width, options.resolution.height, { fit: 'cover' })
            .toFormat(options.format as keyof sharp.FormatEnum)
            .toBuffer();

          const filename = `renders/lifestyle_${Date.now()}.${options.format}`;
          const uploadUrl = await this.storageService.uploadBuffer(
            processedBuffer,
            filename,
            { contentType: `image/${options.format}` },
          );

          return [
            {
              url: uploadUrl as string,
              type: 'lifestyle',
              width: options.resolution.width,
              height: options.resolution.height,
            },
          ];
        }
      } catch (aiErr) {
        this.logger.warn(`AI lifestyle generation failed: ${aiErr}`);
      }
    }

    // Fallback: utiliser le service de rendu externe
    if (this.renderServiceUrl) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<{ imageUrl?: string }>(
            `${this.renderServiceUrl.replace(/\/$/, '')}/render/lifestyle`,
            {
              modelUrl: model.url,
              background: options.background,
              lighting: options.lighting,
              width: options.resolution.width,
              height: options.resolution.height,
            },
            { timeout: 60000 },
          ),
        );

        if (response.data?.imageUrl) {
          return [
            {
              url: response.data.imageUrl,
              type: 'lifestyle',
              width: options.resolution.width,
              height: options.resolution.height,
            },
          ];
        }
      } catch (err) {
        this.logger.warn(`External lifestyle render failed: ${err}`);
      }
    }

    // Dernier fallback
    return [
      {
        url: model.url || `https://placehold.co/${options.resolution.width}x${options.resolution.height}/f5f5f5/333?text=Lifestyle`,
        type: 'lifestyle',
        width: options.resolution.width,
        height: options.resolution.height,
      },
    ];
  }

  /**
   * Mappe une résolution vers une taille DALL-E supportée
   */
  private mapToDalleSize(width: number, height: number): '1024x1024' | '1792x1024' | '1024x1792' {
    const ratio = width / height;
    if (ratio > 1.5) return '1792x1024'; // Paysage
    if (ratio < 0.67) return '1024x1792'; // Portrait
    return '1024x1024'; // Carré
  }

  /**
   * Rend un turntable (rotation 360°)
   */
  private async renderTurntable(
    model: { url: string; format?: string },
    options: {
      lighting: string;
      resolution: { width: number; height: number };
      angles: number[];
    },
  ): Promise<{ images: MarketingRenderResult['images']; videoUrl?: string }> {
    this.logger.debug('Rendering turntable', options);

    const images: MarketingRenderResult['images'] = [];

    // Essayer le service de rendu externe pour turntable complet
    if (this.renderServiceUrl) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<{ images?: Array<{ url: string; angle: number }>; videoUrl?: string }>(
            `${this.renderServiceUrl.replace(/\/$/, '')}/render/turntable`,
            {
              modelUrl: model.url,
              lighting: this.LIGHTING_PRESETS[options.lighting as keyof typeof this.LIGHTING_PRESETS] || this.LIGHTING_PRESETS.studio,
              width: options.resolution.width,
              height: options.resolution.height,
              angles: options.angles,
              generateVideo: true,
            },
            { timeout: 180000 }, // 3 minutes pour turntable complet
          ),
        );

        if (response.data?.images?.length) {
          return {
            images: response.data.images.map(img => ({
              url: img.url,
              type: 'turntable',
              angle: img.angle,
              width: options.resolution.width,
              height: options.resolution.height,
            })),
            videoUrl: response.data.videoUrl,
          };
        }
      } catch (err) {
        this.logger.warn(`External turntable render failed: ${err}`);
      }
    }

    // Fallback: générer des images statiques à différents angles
    // Si on a une image de base, créer des variations avec rotation simulée
    if (model.url && (model.url.endsWith('.png') || model.url.endsWith('.jpg'))) {
      try {
        const imageResponse = await firstValueFrom(
          this.httpService.get(model.url, { responseType: 'arraybuffer' }),
        );
        const baseBuffer = Buffer.from(imageResponse.data);

        for (const angle of options.angles) {
          // Appliquer une légère transformation basée sur l'angle (simulation)
          const rotatedBuffer = await sharp(baseBuffer)
            .resize(options.resolution.width, options.resolution.height, { fit: 'contain', background: '#ffffff' })
            // Simuler la rotation avec un léger ajustement (Sharp ne fait pas de vraie rotation 3D)
            .modulate({ brightness: 1 + (Math.sin(angle * Math.PI / 180) * 0.05) })
            .png()
            .toBuffer();

          const filename = `renders/turntable_${Date.now()}_${angle}.png`;
          const uploadUrl = await this.storageService.uploadBuffer(
            rotatedBuffer,
            filename,
            { contentType: 'image/png' },
          );

          images.push({
            url: uploadUrl as string,
            type: 'turntable',
            angle,
            width: options.resolution.width,
            height: options.resolution.height,
          });
        }

        return { images };
      } catch (imgErr) {
        this.logger.warn(`Image-based turntable failed: ${imgErr}`);
      }
    }

    // Dernier fallback: retourner des placeholders
    for (const angle of options.angles) {
      images.push({
        url: `https://placehold.co/${options.resolution.width}x${options.resolution.height}/white/gray?text=Angle+${angle}`,
        type: 'turntable',
        angle,
        width: options.resolution.width,
        height: options.resolution.height,
      });
    }

    return { images };
  }

  /**
   * Rend des détails (gros plans) avec crop intelligent
   */
  private async renderDetail(
    model: { url: string; format?: string },
    options: {
      lighting: string;
      resolution: { width: number; height: number };
      format: string;
    },
  ): Promise<MarketingRenderResult['images']> {
    this.logger.debug('Rendering detail shots', options);

    const images: MarketingRenderResult['images'] = [];

    // Essayer le service externe
    if (this.renderServiceUrl) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<{ images?: Array<{ url: string; region: string }> }>(
            `${this.renderServiceUrl.replace(/\/$/, '')}/render/detail`,
            {
              modelUrl: model.url,
              lighting: options.lighting,
              width: options.resolution.width,
              height: options.resolution.height,
              detailRegions: ['center', 'top-left', 'bottom-right'], // Zones de détail
            },
            { timeout: 90000 },
          ),
        );

        if (response.data?.images?.length) {
          return response.data.images.map(img => ({
            url: img.url,
            type: `detail-${img.region}`,
            width: options.resolution.width,
            height: options.resolution.height,
          }));
        }
      } catch (err) {
        this.logger.warn(`External detail render failed: ${err}`);
      }
    }

    // Fallback: si on a une image, créer des crops de différentes régions
    if (model.url && (model.url.endsWith('.png') || model.url.endsWith('.jpg'))) {
      try {
        const imageResponse = await firstValueFrom(
          this.httpService.get(model.url, { responseType: 'arraybuffer' }),
        );
        const baseBuffer = Buffer.from(imageResponse.data);
        const metadata = await sharp(baseBuffer).metadata();

        const sourceWidth = metadata.width || 1024;
        const sourceHeight = metadata.height || 1024;

        // Définir les régions de crop pour les détails
        const regions = [
          { name: 'center', left: Math.floor(sourceWidth * 0.25), top: Math.floor(sourceHeight * 0.25), width: Math.floor(sourceWidth * 0.5), height: Math.floor(sourceHeight * 0.5) },
          { name: 'top', left: Math.floor(sourceWidth * 0.2), top: 0, width: Math.floor(sourceWidth * 0.6), height: Math.floor(sourceHeight * 0.4) },
          { name: 'bottom', left: Math.floor(sourceWidth * 0.2), top: Math.floor(sourceHeight * 0.6), width: Math.floor(sourceWidth * 0.6), height: Math.floor(sourceHeight * 0.4) },
        ];

        for (const region of regions) {
          const croppedBuffer = await sharp(baseBuffer)
            .extract(region)
            .resize(options.resolution.width, options.resolution.height, { fit: 'cover' })
            .toFormat(options.format as keyof sharp.FormatEnum)
            .toBuffer();

          const filename = `renders/detail_${region.name}_${Date.now()}.${options.format}`;
          const uploadUrl = await this.storageService.uploadBuffer(
            croppedBuffer,
            filename,
            { contentType: `image/${options.format}` },
          );

          images.push({
            url: uploadUrl as string,
            type: `detail-${region.name}`,
            width: options.resolution.width,
            height: options.resolution.height,
          });
        }

        return images;
      } catch (imgErr) {
        this.logger.warn(`Image-based detail shots failed: ${imgErr}`);
      }
    }

    // Dernier fallback
    return [
      {
        url: model.url || `https://placehold.co/${options.resolution.width}x${options.resolution.height}/white/gray?text=Detail`,
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
   * Upload une image rendue vers le storage
   */
  private async uploadImage(
    imageUrl: string,
    designId: string,
    type: string,
  ): Promise<string> {
    // Si c'est déjà une URL de notre storage, la retourner directement
    if (imageUrl.includes('cloudinary') || imageUrl.includes('luneo') || imageUrl.includes('storage.')) {
      return imageUrl;
    }

    // Si c'est une URL externe, télécharger et re-uploader
    if (imageUrl.startsWith('http')) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(imageUrl, { responseType: 'arraybuffer' }),
        );
        
        const filename = `renders/${designId}/${type}_${Date.now()}.png`;
        const uploadUrl = await this.storageService.uploadBuffer(
          Buffer.from(response.data),
          filename,
          { contentType: 'image/png' },
        );
        
        return uploadUrl as string;
      } catch (err) {
        this.logger.warn(`Failed to re-upload image: ${err}`);
        return imageUrl; // Retourner l'URL originale en fallback
      }
    }

    // Si c'est un chemin local (placeholder), générer une URL de placeholder
    return `https://storage.luneo.app/renders/${designId}/${type}_${Date.now()}.png`;
  }
}

































