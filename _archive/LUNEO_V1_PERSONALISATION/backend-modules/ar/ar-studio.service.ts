/**
 * ★★★ SERVICE - AR STUDIO ★★★
 * Service NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@/libs/storage/storage.service';
import { CACHE_DURATIONS, TIMEOUTS } from '@/common/constants/app.constants';
import { AR_STUDIO_CONFIG } from './ar-studio.constants';

export interface ARModel {
  id: string;
  name: string;
  type: string;
  glbUrl?: string;
  usdzUrl?: string;
  thumbnailUrl?: string;
  status: string;
  brandId: string;
  productId?: string;
  viewsCount: number;
  tryOnsCount: number;
  conversionsCount: number;
  metadata?: Record<string, unknown>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QRCodeData {
  url: string;
  qrCodeUrl: string;
  expiresAt: Date;
}

@Injectable()
export class ArStudioService {
  private readonly logger = new Logger(ArStudioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Liste tous les modèles AR d'une marque
   */
  async listModels(brandId: string): Promise<ARModel[]> {
    try {
      this.logger.log(`Listing AR models for brand: ${brandId}`);

      // Récupérer les produits avec modèles 3D/AR
      const products = await this.prisma.product.findMany({
        where: {
          brandId,
          model3dUrl: { not: null },
        },
        select: {
          id: true,
          name: true,
          model3dUrl: true,
          thumbnailUrl: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          modelConfig: true,
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Transformer en format ARModel
      return Promise.all(products.map(async (product) => ({
        id: product.id,
        name: product.name,
        type: product.category || 'other',
        glbUrl: product.model3dUrl || undefined,
        usdzUrl: product.model3dUrl || undefined, // Utiliser model3dUrl pour USDZ aussi
        thumbnailUrl: product.thumbnailUrl || undefined,
        status: product.status === 'ACTIVE' ? 'active' : 'archived',
        brandId,
        productId: product.id,
        viewsCount: await this.getARViewsCount(product.id, brandId),
        tryOnsCount: await this.getARTryOnsCount(product.id, brandId),
        conversionsCount: await this.getARConversionsCount(product.id, brandId),
        metadata: (product.modelConfig as Record<string, unknown>) || undefined,
        tags: product.tags || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to list AR models: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Récupère un modèle AR par ID
   */
  async getModelById(modelId: string, brandId: string): Promise<ARModel | null> {
    try {
      this.logger.log(`Getting AR model: ${modelId}`);

      const product = await this.prisma.product.findFirst({
        where: {
          id: modelId,
          brandId,
          model3dUrl: { not: null },
        },
        select: {
          id: true,
          name: true,
          model3dUrl: true,
          thumbnailUrl: true,
          category: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          modelConfig: true,
          tags: true,
        },
      });

      if (!product) {
        return null;
      }

      return {
        id: product.id,
        name: product.name,
        type: product.category || 'other',
        glbUrl: product.model3dUrl || undefined,
        usdzUrl: product.model3dUrl || undefined, // Utiliser model3dUrl pour USDZ aussi
        thumbnailUrl: product.thumbnailUrl || undefined,
        status: product.status === 'ACTIVE' ? 'active' : 'archived',
        brandId,
        productId: product.id,
        viewsCount: await this.getARViewsCount(product.id, brandId),
        tryOnsCount: await this.getARTryOnsCount(product.id, brandId),
        conversionsCount: await this.getARConversionsCount(product.id, brandId),
        metadata: (product.modelConfig as Record<string, unknown>) || undefined,
        tags: product.tags || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get AR model: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Génère un QR code pour partager un modèle AR
   */
  async generateQRCode(modelId: string, brandId: string): Promise<QRCodeData> {
    try {
      this.logger.log(`Generating QR code for AR model: ${modelId}`);

      const model = await this.getModelById(modelId, brandId);
      if (!model) {
        throw new NotFoundException('AR model not found');
      }

      // URL de preview AR (à configurer selon votre domaine)
      const baseUrl = this.configService.get<string>('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
      const previewUrl = `${baseUrl}/ar/preview/${modelId}`;

      // Generate QR code using external API service
      const qrCodeUrl = `${AR_STUDIO_CONFIG.QR_CODE_API}?size=300x300&data=${encodeURIComponent(previewUrl)}`;

      return {
        url: previewUrl,
        qrCodeUrl,
        expiresAt: new Date(Date.now() + CACHE_DURATIONS.LONG * 1000),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to generate QR code: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Récupère les analytics d'un modèle AR
   */
  async getModelAnalytics(modelId: string, brandId: string): Promise<{
    views: number;
    tryOns: number;
    conversions: number;
    conversionRate: number;
  }> {
    try {
      this.logger.log(`Getting analytics for AR model: ${modelId}`);

      // Récupérer les événements analytics pour ce modèle
      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          brandId,
          eventType: {
            in: ['ar_view', 'ar_try_on', 'ar_conversion'],
          },
          properties: {
            path: ['modelId'],
            equals: modelId,
          } as Prisma.JsonFilter,
        },
        select: {
          eventType: true,
        },
        take: 1000,
      });

      const views = events.filter((e) => e.eventType === 'ar_view').length;
      const tryOns = events.filter((e) => e.eventType === 'ar_try_on').length;
      const conversions = events.filter((e) => e.eventType === 'ar_conversion').length;
      const conversionRate = tryOns > 0 ? (conversions / tryOns) * 100 : 0;

      return {
        views,
        tryOns,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get model analytics: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Convertit une image 2D en modèle 3D via Meshy.ai
   */
  async convert2DTo3D(userId: string, brandId: string, designId: string, imageUrl: string) {
    try {
      this.logger.log(`Converting 2D to 3D for design: ${designId}`);

      // Vérifier que le design appartient à l'utilisateur
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
        select: { id: true, userId: true, brandId: true, prompt: true },
      });

      if (!design) {
        throw new NotFoundException('Design not found');
      }

      if (design.userId !== userId || design.brandId !== brandId) {
        throw new ForbiddenException('Access denied to this design');
      }

      const meshyApiKey = this.configService.get<string>('MESHY_API_KEY');
      if (!meshyApiKey) {
        throw new BadRequestException('Meshy.ai API not configured');
      }

      // Initier la conversion avec Meshy.ai
      const meshyResponse = await fetch(`${AR_STUDIO_CONFIG.MESHY_API_BASE}/image-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meshyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          enable_pbr: true,
          ai_model: 'meshy-4',
        }),
      });

      if (!meshyResponse.ok) {
        const errorData = await meshyResponse.json().catch(() => ({}));
        throw new BadRequestException(errorData.message || 'Meshy.ai conversion failed');
      }

      const meshyData = await meshyResponse.json();
      const taskId = meshyData.result;

      // Créer un produit AR en statut "processing"
      const productName = `${design.prompt?.substring(0, 50) || 'Design'} - 3D`;
      const product = await this.prisma.product.create({
        data: {
          name: productName,
          slug: `design-3d-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          description: 'Converti depuis design 2D avec Meshy.ai',
          price: 0, // Prix par défaut, peut être mis à jour plus tard
          brand: { connect: { id: brandId } },
          model3dUrl: '', // Sera mis à jour quand prêt
          status: 'DRAFT',
          modelConfig: {
            meshy_task_id: taskId,
            source: 'meshy_ai',
            conversion_started_at: new Date().toISOString(),
            designId,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        ar_model_id: product.id,
        task_id: taskId,
        status: 'processing',
        estimated_time: '2-5 minutes',
        message: 'Conversion en cours. Vous serez notifié quand le modèle 3D sera prêt.',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to convert 2D to 3D: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Vérifie le statut d'une conversion Meshy.ai
   */
  async getConversionStatus(taskId: string, userId: string, brandId: string) {
    try {
      this.logger.log(`Checking conversion status for task: ${taskId}`);

      const meshyApiKey = this.configService.get<string>('MESHY_API_KEY');
      if (!meshyApiKey) {
        throw new BadRequestException('Meshy.ai API not configured');
      }

      // Vérifier le statut sur Meshy.ai
      const statusResponse = await fetch(`${AR_STUDIO_CONFIG.MESHY_API_BASE}/image-to-3d/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${meshyApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new BadRequestException('Failed to check conversion status');
      }

      const statusData = await statusResponse.json();

      // Si terminé, mettre à jour le produit AR
      if (statusData.status === 'SUCCEEDED') {
        // Find product by checking modelConfig JSON field
        const products = await this.prisma.product.findMany({
          where: { brandId },
          take: 100,
        });
        const product = products.find((p) => {
          const config = p.modelConfig as Record<string, unknown> | null;
          return config?.meshy_task_id === taskId;
        });

        if (product) {
          const currentConfig = (product.modelConfig as Record<string, unknown>) || {};
          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              model3dUrl: statusData.model_urls?.glb,
              status: 'ACTIVE',
              modelConfig: {
                ...currentConfig,
                meshy_task_id: taskId,
                source: 'meshy_ai',
                conversion_completed_at: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          });
        }
      }

      return {
        status: statusData.status,
        progress: statusData.progress,
        model_url: statusData.model_urls?.glb,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get conversion status: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Exporte un modèle AR en différents formats (GLB, USDZ)
   */
  async exportModel(
    modelId: string,
    brandId: string,
    format: 'glb' | 'usdz',
    options: {
      optimize?: boolean;
      includeTextures?: boolean;
      compressionLevel?: 'low' | 'medium' | 'high';
    } = {},
  ): Promise<{
    downloadUrl: string;
    fileSize: number;
    format: string;
    expiresAt: Date;
  }> {
    try {
      this.logger.log(`Exporting AR model ${modelId} as ${format}`);

      const model = await this.getModelById(modelId, brandId);
      if (!model) {
        throw new NotFoundException('AR model not found');
      }

      const sourceUrl = format === 'usdz' ? model.usdzUrl : model.glbUrl;
      if (!sourceUrl) {
        throw new BadRequestException(`Model does not have ${format.toUpperCase()} format available`);
      }

      // Optimiser/compresser le modèle si demandé
      let finalUrl = sourceUrl;
      let fileSize = 0;

      if (options.optimize !== false) {
        try {
          const optimizedUrl = await this.optimizeModel(sourceUrl, format, options.compressionLevel || 'medium');
          if (optimizedUrl) {
            finalUrl = optimizedUrl;
            this.logger.log(`Model optimized: ${sourceUrl} → ${finalUrl}`);
          }
        } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

          this.logger.warn(`Failed to optimize model, using original: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
          // Continue avec l'URL originale si optimisation échoue
        }
      }

      // Calculer la taille du fichier depuis les headers HTTP
      try {
        const headResponse = await fetch(finalUrl, { method: 'HEAD' });
        if (headResponse.ok) {
          const contentLength = headResponse.headers.get('content-length');
          if (contentLength) {
            fileSize = parseInt(contentLength, 10);
          }
        }
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.warn(`Failed to get file size from headers for ${finalUrl}: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
        // Continue avec fileSize = 0 si échec
      }

      // Générer URL signée avec expiration si stockage privé
      let signedUrl = finalUrl;
      const expiresIn = CACHE_DURATIONS.MEDIUM;
      
      // Vérifier si le modèle est privé (basé sur les permissions ou la configuration)
      // Un modèle est privé si le produit n'est pas public
      // Récupérer le produit pour vérifier isPublic
      const product = await this.prisma.product.findUnique({
        where: { id: model.productId || model.id },
        select: { isPublic: true },
      });
      const isPrivate = !product?.isPublic || false;
      
      if (isPrivate && this.storageService && finalUrl.includes('cloudinary.com')) {
        try {
          // Extraire la clé/publicId depuis l'URL Cloudinary
          // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
          const urlMatch = finalUrl.match(/\/upload\/(?:v\d+\/)?([^\/]+)\.(glb|usdz|gltf)/);
          if (urlMatch && urlMatch[1]) {
            const publicId = urlMatch[1];
            signedUrl = await this.storageService.getSignedUrl(publicId, expiresIn);
            this.logger.log(`Generated signed URL for private AR model: ${model.id}`);
          } else {
            this.logger.warn(`Could not extract publicId from Cloudinary URL: ${finalUrl}`);
          }
        } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

          this.logger.warn(`Failed to generate signed URL, using original URL: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
          // Continue avec l'URL originale si la génération échoue
        }
      }

      return {
        downloadUrl: signedUrl,
        fileSize,
        format,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to export AR model: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Convertit un modèle GLB en USDZ
   */
  async convertGLBToUSDZ(
    glbUrl: string,
    userId: string,
    brandId: string,
    options: {
      productName?: string;
      scale?: number;
      optimize?: boolean;
      arModelId?: string;
    } = {},
  ): Promise<{
    usdzUrl: string;
    fileSize: number;
    conversionTime: number;
    cached: boolean;
  }> {
    const startTime = Date.now();
    try {
      this.logger.log(`Converting GLB to USDZ: ${glbUrl}`);

      // Vérifier si USDZ existe déjà en cache
      if (options.arModelId) {
        const product = await this.prisma.product.findUnique({
          where: { id: options.arModelId },
          select: { model3dUrl: true, modelConfig: true },
        });

        if (product) {
          const config = (product.modelConfig as Record<string, unknown>) || {};
          if (config.usdzUrl) {
            this.logger.log('USDZ already exists (cached)', { arModelId: options.arModelId });
            return {
              usdzUrl: config.usdzUrl as string,
              fileSize: (config.usdzFileSize as number) || 0,
              conversionTime: Date.now() - startTime,
              cached: true,
            };
          }
        }
      }

      // Utiliser CloudConvert ou service interne pour conversion
      const cloudConvertKey = this.configService.get<string>('CLOUDCONVERT_API_KEY');
      let usdzUrl: string;

      if (cloudConvertKey) {
        // Conversion via CloudConvert
        const convertResponse = await fetch(`${AR_STUDIO_CONFIG.CLOUDCONVERT_API_BASE}/convert`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudConvertKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputformat: 'glb',
            outputformat: 'usdz',
            input: 'download',
            file: glbUrl,
            options: {
              optimize: options.optimize !== false,
            },
          }),
        });

        if (!convertResponse.ok) {
          throw new BadRequestException('CloudConvert conversion failed');
        }

        const convertData = await convertResponse.json();
        usdzUrl = convertData.output.url;
      } else {
        // Fallback: utiliser service interne ou API externe
        const conversionApiUrl = this.configService.get<string>('USDZ_CONVERSION_API_URL') || AR_STUDIO_CONFIG.USDZ_CONVERSION_API;
        
        const response = await fetch(conversionApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            glb_url: glbUrl,
            optimize: options.optimize !== false,
          }),
        });

        if (!response.ok) {
          throw new BadRequestException('USDZ conversion service failed');
        }

        const data = await response.json();
        usdzUrl = data.usdz_url || data.url;
      }

      // Calculer la taille du fichier USDZ depuis les headers HTTP
      let usdzFileSize = 0;
      try {
        const headResponse = await fetch(usdzUrl, { method: 'HEAD' });
        if (headResponse.ok) {
          const contentLength = headResponse.headers.get('content-length');
          if (contentLength) {
            usdzFileSize = parseInt(contentLength, 10);
          }
        }
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.warn(`Failed to get USDZ file size from headers: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
        // Continue avec usdzFileSize = 0 si échec
      }

      // Sauvegarder USDZ dans le produit si arModelId fourni
      if (options.arModelId) {
        const product = await this.prisma.product.findUnique({
          where: { id: options.arModelId },
        });

        if (product) {
          const currentConfig = (product.modelConfig as Record<string, unknown>) || {};
          await this.prisma.product.update({
            where: { id: options.arModelId },
            data: {
              modelConfig: {
                ...currentConfig,
                usdzUrl,
                usdzFileSize,
                usdzConvertedAt: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          });
        }
      }

      return {
        usdzUrl,
        fileSize: usdzFileSize,
        conversionTime: Date.now() - startTime,
        cached: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to convert GLB to USDZ: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Optimise/compresse un modèle 3D via CloudConvert
   */
  private async optimizeModel(
    modelUrl: string,
    format: 'glb' | 'usdz',
    compressionLevel: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<string | null> {
    try {
      const cloudConvertKey = this.configService.get<string>('CLOUDCONVERT_API_KEY');
      if (!cloudConvertKey) {
        this.logger.debug('CloudConvert API key not configured, skipping optimization');
        return null;
      }

      // Mapping compression level vers CloudConvert options
      const compressionLevels = {
        low: 3,
        medium: 5,
        high: 7,
      };

      const compressionValue = compressionLevels[compressionLevel] || 5;

      // Pour GLB, utiliser l'optimisation GLTF
      if (format === 'glb') {
        const optimizeResponse = await fetch(`${AR_STUDIO_CONFIG.CLOUDCONVERT_API_BASE}/jobs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudConvertKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tasks: {
              'import-model': {
                operation: 'import/url',
                url: modelUrl,
              },
              'optimize-model': {
                operation: 'optimize/model',
                input: 'import-model',
                input_format: 'glb',
                output_format: 'glb',
                options: {
                  compression_level: compressionValue,
                  optimize_meshes: true,
                  optimize_textures: true,
                },
              },
              'export-model': {
                operation: 'export/url',
                input: 'optimize-model',
                inline: false,
              },
            },
          }),
        });

        if (!optimizeResponse.ok) {
          throw new InternalServerErrorException(`CloudConvert optimization failed: ${optimizeResponse.statusText}`);
        }

        const jobData = await optimizeResponse.json();
        const jobId = jobData.data.id;

        // Attendre la fin du job (polling)
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.POLLING_INTERVAL));

          const statusResponse = await fetch(`${AR_STUDIO_CONFIG.CLOUDCONVERT_API_BASE}/jobs/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${cloudConvertKey}`,
            },
          });

          const statusData = await statusResponse.json();
          const task = statusData.data.tasks?.find((t: { name: string }) => t.name === 'export-model');

          if (task?.status === 'finished') {
            return task.result?.files?.[0]?.url || null;
          }

          if (task?.status === 'error') {
            throw new InternalServerErrorException(`CloudConvert optimization error: ${task.message}`);
          }

          attempts++;
        }

        throw new InternalServerErrorException('CloudConvert optimization timeout');
      }

      // Pour USDZ, l'optimisation est déjà gérée dans convertGLBToUSDZ
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.warn(`Model optimization failed: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * ✅ Calculer le nombre de vues AR depuis AnalyticsEvent
   */
  private async getARViewsCount(productId: string, brandId: string): Promise<number> {
    try {
      const count = await this.prisma.analyticsEvent.count({
        where: {
          brandId,
          eventType: 'ar_view',
          properties: {
            path: ['productId'],
            equals: productId,
          } as Prisma.JsonFilter,
        },
      });
      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.warn(`Failed to get AR views count for product ${productId}: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
      return 0; // Fallback à 0 en cas d'erreur
    }
  }

  /**
   * ✅ Calculer le nombre d'essais AR depuis AnalyticsEvent
   */
  private async getARTryOnsCount(productId: string, brandId: string): Promise<number> {
    try {
      const count = await this.prisma.analyticsEvent.count({
        where: {
          brandId,
          eventType: 'ar_try_on',
          properties: {
            path: ['productId'],
            equals: productId,
          } as Prisma.JsonFilter,
        },
      });
      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.warn(`Failed to get AR try-ons count for product ${productId}: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
      return 0; // Fallback à 0 en cas d'erreur
    }
  }

  /**
   * ✅ Calculer le nombre de conversions depuis Order
   */
  private async getARConversionsCount(productId: string, brandId: string): Promise<number> {
    try {
      const count = await this.prisma.orderItem.count({
        where: {
          productId,
          order: {
            brandId,
            status: {
              not: 'CANCELLED',
            },
          },
        },
      });
      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const _errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.warn(`Failed to get AR conversions count for product ${productId}: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
      return 0; // Fallback à 0 en cas d'erreur
    }
  }

  /**
   * Upload a 3D model file and create a Product record.
   */
  async uploadModel(
    brandId: string,
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    metadata: { name: string; format?: string; projectId?: string },
  ): Promise<ARModel> {
    const ALLOWED_EXTENSIONS = ['.glb', '.gltf', '.usdz', '.obj', '.fbx'];

    const ext = `.${file.originalname.split('.').pop()?.toLowerCase() || ''}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Format non supporté. Formats autorisés: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    const maxSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSize) {
      throw new BadRequestException('Le fichier dépasse la taille maximale de 100 MB');
    }

    const storageKey = `ar-studio/${brandId}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const modelUrl = await this.storageService.uploadBuffer(
      file.buffer,
      storageKey,
      {
        contentType: file.mimetype || 'application/octet-stream',
        bucket: 'luneo-ar-models',
      },
    );

    const slug = `ar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const product = await this.prisma.product.create({
      data: {
        name: metadata.name || file.originalname.replace(/\.[^/.]+$/, ''),
        slug,
        description: 'Modèle AR uploadé',
        price: 0,
        brand: { connect: { id: brandId } },
        model3dUrl: modelUrl,
        status: 'ACTIVE',
        modelConfig: {
          source: 'ar_studio_upload',
          format: ext.slice(1),
          originalName: file.originalname,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          projectId: metadata.projectId,
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        model3dUrl: true,
        thumbnailUrl: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        modelConfig: true,
        tags: true,
      },
    });

    return {
      id: product.id,
      name: product.name,
      type: product.category || 'other',
      glbUrl: product.model3dUrl || undefined,
      usdzUrl: product.model3dUrl || undefined,
      thumbnailUrl: product.thumbnailUrl || undefined,
      status: product.status === 'ACTIVE' ? 'active' : 'archived',
      brandId,
      productId: product.id,
      viewsCount: 0,
      tryOnsCount: 0,
      conversionsCount: 0,
      metadata: (product.modelConfig as Record<string, unknown>) || undefined,
      tags: product.tags || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Delete an AR model by ID. Checks ownership (brand must own the product).
   */
  async deleteModel(modelId: string, brandId: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: modelId,
        brandId,
        model3dUrl: { not: null },
      },
    });
    if (!product) {
      throw new NotFoundException('AR model not found');
    }
    await this.prisma.product.delete({
      where: { id: modelId },
    });
  }

  /**
   * Brand-level AR analytics. Period: 7d, 30d, 90d.
   */
  async getBrandAnalytics(
    brandId: string,
    period: '7d' | '30d' | '90d',
  ): Promise<{
    totalViews: number;
    totalTryOns: number;
    averageSessionDuration: number;
    mostPopularModels: Array<{ modelId: string; name: string; views: number; tryOns: number }>;
  }> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        brandId,
        eventType: { in: ['ar_view', 'ar_try_on'] },
        timestamp: { gte: since },
      },
      select: { eventType: true, properties: true },
      take: 1000,
    });

    const totalViews = events.filter((e) => e.eventType === 'ar_view').length;
    const totalTryOns = events.filter((e) => e.eventType === 'ar_try_on').length;

    const modelIdCounts: Record<string, { views: number; tryOns: number }> = {};
    for (const e of events) {
      const props = e.properties as Record<string, unknown> | null;
      const modelId = (props?.modelId ?? props?.productId) as string | undefined;
      if (modelId) {
        if (!modelIdCounts[modelId]) modelIdCounts[modelId] = { views: 0, tryOns: 0 };
        if (e.eventType === 'ar_view') modelIdCounts[modelId].views++;
        else modelIdCounts[modelId].tryOns++;
      }
    }

    const topModelIds = Object.entries(modelIdCounts)
      .sort((a, b) => b[1].views + b[1].tryOns - (a[1].views + a[1].tryOns))
      .slice(0, 10)
      .map(([id]) => id);

    const products = await this.prisma.product.findMany({
      where: { id: { in: topModelIds }, brandId },
      select: { id: true, name: true },
      take: 10,
    });
    const nameById = Object.fromEntries(products.map((p) => [p.id, p.name]));

    const mostPopularModels = topModelIds.map((modelId) => ({
      modelId,
      name: nameById[modelId] ?? modelId,
      views: modelIdCounts[modelId]?.views ?? 0,
      tryOns: modelIdCounts[modelId]?.tryOns ?? 0,
    }));

    return {
      totalViews,
      totalTryOns,
      averageSessionDuration: 0,
      mostPopularModels,
    };
  }

  /**
   * List AR sessions for the brand (derived from AnalyticsEvent sessionId).
   */
  async listSessions(
    brandId: string,
    page: number,
    limit: number,
  ): Promise<{ sessions: Array<{ id: string; sessionId: string; modelId?: string; timestamp: Date }>; total: number }> {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const groups = await this.prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      _max: { timestamp: true },
      where: {
        brandId,
        eventType: 'ar_view',
        sessionId: { not: null },
        timestamp: { gte: since },
      },
    });

    const sorted = groups
      .filter((g) => g.sessionId != null && g._max?.timestamp != null)
      .sort((a, b) => (b._max!.timestamp!.getTime() - a._max!.timestamp!.getTime()));

    const total = sorted.length;
    const start = (page - 1) * limit;
    const pageGroups = sorted.slice(start, start + limit);

    const sessions = pageGroups.map((g) => ({
      id: g.sessionId!,
      sessionId: g.sessionId!,
      modelId: undefined as string | undefined,
      timestamp: g._max!.timestamp!,
    }));

    return { sessions, total };
  }
}


