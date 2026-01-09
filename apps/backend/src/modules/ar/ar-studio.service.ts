/**
 * ★★★ SERVICE - AR STUDIO ★★★
 * Service NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

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
      this.logger.error(`Failed to list AR models: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      this.logger.error(`Failed to get AR model: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
        throw new Error('AR model not found');
      }

      // URL de preview AR (à configurer selon votre domaine)
      const baseUrl = process.env.FRONTEND_URL || 'https://luneo.app';
      const previewUrl = `${baseUrl}/ar/preview/${modelId}`;

      // Générer QR code (utiliser une librairie comme qrcode)
      // Pour l'instant, retourner une URL placeholder
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(previewUrl)}`;

      return {
        url: previewUrl,
        qrCodeUrl,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      };
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
          },
        },
        select: {
          eventType: true,
        },
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
      this.logger.error(`Failed to get model analytics: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      const meshyResponse = await fetch('https://api.meshy.ai/v2/image-to-3d', {
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
          } as any,
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
      this.logger.error(`Failed to convert 2D to 3D: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      const statusResponse = await fetch(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, {
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
        });
        const product = products.find((p) => {
          const config = p.modelConfig as any;
          return config?.meshy_task_id === taskId;
        });

        if (product) {
          const currentConfig = (product.modelConfig as any) || {};
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
              } as any,
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
      this.logger.error(`Failed to get conversion status: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
          this.logger.warn(`Failed to optimize model, using original: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        this.logger.warn(`Failed to get file size from headers for ${finalUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue avec fileSize = 0 si échec
      }

      // TODO: Générer URL signée avec expiration si stockage privé

      return {
        downloadUrl: finalUrl,
        fileSize,
        format,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      };
    } catch (error) {
      this.logger.error(`Failed to export AR model: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
          const config = (product.modelConfig as any) || {};
          if (config.usdzUrl) {
            this.logger.log('USDZ already exists (cached)', { arModelId: options.arModelId });
            return {
              usdzUrl: config.usdzUrl,
              fileSize: config.usdzFileSize || 0,
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
        const convertResponse = await fetch('https://api.cloudconvert.com/v2/convert', {
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
        const conversionApiUrl = this.configService.get<string>('USDZ_CONVERSION_API_URL') || 'https://api.luneo.app/ar/convert-usdz';
        
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
        this.logger.warn(`Failed to get USDZ file size from headers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue avec usdzFileSize = 0 si échec
      }

      // Sauvegarder USDZ dans le produit si arModelId fourni
      if (options.arModelId) {
        const product = await this.prisma.product.findUnique({
          where: { id: options.arModelId },
        });

        if (product) {
          const currentConfig = ((product.modelConfig as any) || {}) as Record<string, unknown>;
          await this.prisma.product.update({
            where: { id: options.arModelId },
            data: {
              modelConfig: {
                ...currentConfig,
                usdzUrl,
                usdzFileSize,
                usdzConvertedAt: new Date().toISOString(),
              } as any,
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
      this.logger.error(`Failed to convert GLB to USDZ: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
        const optimizeResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
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
          throw new Error(`CloudConvert optimization failed: ${optimizeResponse.statusText}`);
        }

        const jobData = await optimizeResponse.json();
        const jobId = jobData.data.id;

        // Attendre la fin du job (polling)
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Attendre 5 secondes

          const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
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
            throw new Error(`CloudConvert optimization error: ${task.message}`);
          }

          attempts++;
        }

        throw new Error('CloudConvert optimization timeout');
      }

      // Pour USDZ, l'optimisation est déjà gérée dans convertGLBToUSDZ
      return null;
    } catch (error) {
      this.logger.warn(`Model optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          } as any, // Prisma JSON filter
        },
      });
      return count;
    } catch (error) {
      this.logger.warn(`Failed to get AR views count for product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          } as any, // Prisma JSON filter
        },
      });
      return count;
    } catch (error) {
      this.logger.warn(`Failed to get AR try-ons count for product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      this.logger.warn(`Failed to get AR conversions count for product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return 0; // Fallback à 0 en cas d'erreur
    }
  }
}


