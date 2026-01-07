/**
 * ★★★ SERVICE - AR STUDIO ★★★
 * Service NestJS pour AR Studio
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

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
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        type: product.category || 'other',
        glbUrl: product.model3dUrl || undefined,
        usdzUrl: product.model3dUrl || undefined, // Utiliser model3dUrl pour USDZ aussi
        thumbnailUrl: product.thumbnailUrl || undefined,
        status: product.status === 'ACTIVE' ? 'active' : 'archived',
        brandId,
        productId: product.id,
        viewsCount: 0, // TODO: Calculer depuis AnalyticsEvent
        tryOnsCount: 0, // TODO: Calculer depuis AnalyticsEvent
        conversionsCount: 0, // TODO: Calculer depuis Order
        metadata: (product.modelConfig as Record<string, unknown>) || undefined,
        tags: product.tags || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
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
        viewsCount: 0, // TODO: Calculer depuis AnalyticsEvent
        tryOnsCount: 0, // TODO: Calculer depuis AnalyticsEvent
        conversionsCount: 0, // TODO: Calculer depuis Order
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
}


