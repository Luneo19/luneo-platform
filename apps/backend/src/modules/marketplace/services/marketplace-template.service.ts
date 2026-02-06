/**
 * @fileoverview Service de gestion des templates marketplace
 * @module MarketplaceTemplateService
 *
 * Conforme au plan PHASE 7 - Marketplace & Communauté - Templates DB
 *
 * FONCTIONNALITÉS:
 * - Création et publication de templates
 * - Recherche et filtrage
 * - Gestion des catégories et tags
 * - Calcul des statistiques
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Logging structuré
 * - ✅ SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Prisma } from '@prisma/client';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Données de création de template marketplace
 */
export interface CreateMarketplaceTemplateData {
  creatorId: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  tags?: string[];
  promptTemplate: string;
  negativePrompt?: string;
  variables?: Record<string, unknown>;
  exampleOutputs?: string[];
  aiProvider?: string;
  model?: string;
  quality?: string;
  style?: string;
  priceCents?: number;
  isFree?: boolean;
  revenueSharePercent?: number;
  thumbnailUrl?: string;
  previewImages?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Options de recherche
 */
export interface SearchTemplatesOptions {
  category?: string;
  tags?: string[];
  search?: string;
  creatorId?: string;
  minRating?: number;
  featured?: boolean;
  status?: 'draft' | 'pending_review' | 'published' | 'archived';
  sortBy?: 'newest' | 'popular' | 'rating' | 'price' | 'downloads';
  page?: number;
  limit?: number;
}

/**
 * Template marketplace
 */
export interface MarketplaceTemplate {
  id: string;
  creatorId: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  tags: string[];
  promptTemplate: string;
  negativePrompt?: string;
  variables?: Record<string, unknown>;
  exampleOutputs: string[];
  aiProvider: string;
  model: string;
  quality: string;
  style: string;
  priceCents: number;
  isFree: boolean;
  revenueSharePercent: number;
  downloads: number;
  likes: number;
  reviews: number;
  averageRating: number;
  totalRevenueCents: number;
  status: string;
  publishedAt?: Date;
  featured: boolean;
  thumbnailUrl?: string;
  previewImages: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class MarketplaceTemplateService {
  private readonly logger = new Logger(MarketplaceTemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Crée un template marketplace
   * Conforme au plan PHASE 7 - Templates DB
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRaw
   */
  async createTemplate(data: CreateMarketplaceTemplateData): Promise<MarketplaceTemplate> {
    // ✅ Validation
    if (!data.creatorId || typeof data.creatorId !== 'string' || data.creatorId.trim().length === 0) {
      throw new BadRequestException('Creator ID is required');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new BadRequestException('Template name is required');
    }

    if (!data.slug || typeof data.slug !== 'string' || data.slug.trim().length === 0) {
      throw new BadRequestException('Template slug is required');
    }

    if (!data.promptTemplate || typeof data.promptTemplate !== 'string' || data.promptTemplate.trim().length === 0) {
      throw new BadRequestException('Prompt template is required');
    }

    // ✅ Validation du slug (alphanumeric + dash, 3-100 chars)
    const slugRegex = /^[a-z0-9-]{3,100}$/;
    const cleanSlug = data.slug.trim();
    if (!slugRegex.test(cleanSlug)) {
      throw new BadRequestException('Slug must be 3-100 characters, lowercase alphanumeric and dashes only');
    }

    // ✅ Vérifier que le slug n'est pas déjà pris (contrainte unique sur slug)
    const existing = await this.prisma.marketplaceTemplate.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      throw new BadRequestException('Slug already taken');
    }

    try {
      // ✅ Créer le template avec Prisma
      const template = await this.prisma.marketplaceTemplate.create({
        data: {
          creatorId: data.creatorId.trim(),
          name: data.name.trim(),
          slug: cleanSlug,
          description: data.description || null,
          category: data.category || null,
          tags: data.tags || [],
          promptTemplate: data.promptTemplate.trim(),
          negativePrompt: data.negativePrompt || null,
          variables: data.variables ? (data.variables as Prisma.JsonObject) : Prisma.JsonNull,
          exampleOutputs: data.exampleOutputs || [],
          aiProvider: data.aiProvider || 'openai',
          model: data.model || 'dall-e-3',
          quality: data.quality || 'standard',
          style: data.style || 'natural',
          priceCents: data.priceCents || 0,
          isFree: data.isFree !== undefined ? data.isFree : (data.priceCents === 0 || !data.priceCents),
          revenueSharePercent: data.revenueSharePercent || 70,
          downloads: 0,
          likes: 0,
          reviews: 0,
          averageRating: 0.0,
          totalRevenueCents: 0,
          status: 'draft',
          featured: false,
          thumbnailUrl: data.thumbnailUrl || null,
          previewImages: data.previewImages || [],
          metadata: data.metadata ? (data.metadata as Prisma.JsonObject) : Prisma.JsonNull,
        },
      });

      this.logger.log(`Marketplace template created: ${data.slug} by creator ${data.creatorId}`);

      return template as unknown as MarketplaceTemplate;
    } catch (error) {
      this.logger.error(
        `Failed to create marketplace template: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient un template par slug
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRaw
   */
  async getTemplateBySlug(slug: string): Promise<MarketplaceTemplate> {
    // ✅ Validation
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      throw new BadRequestException('Slug is required');
    }

    const template = await this.prisma.marketplaceTemplate.findUnique({
      where: { slug: slug.trim() },
    });

    if (!template) {
      throw new NotFoundException(`Template not found: ${slug}`);
    }

    return template as unknown as MarketplaceTemplate;
  }

  /**
   * Recherche des templates
   * Conforme au plan PHASE 7 - Recherche et filtrage
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async searchTemplates(options: SearchTemplatesOptions = {}): Promise<{
    templates: MarketplaceTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    try {
      // ✅ Construire le filtre Prisma dynamique
      const where: Prisma.MarketplaceTemplateWhereInput = {};

      // Status par défaut: seulement published
      where.status = options.status || 'published';

      if (options.category) {
        where.category = options.category;
      }

      if (options.creatorId) {
        where.creatorId = options.creatorId;
      }

      if (options.featured !== undefined) {
        where.featured = options.featured;
      }

      if (options.minRating !== undefined) {
        where.averageRating = { gte: options.minRating };
      }

      if (options.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      if (options.tags && options.tags.length > 0) {
        where.tags = { hasSome: options.tags };
      }

      // ✅ Déterminer le tri
      let orderBy: Prisma.MarketplaceTemplateOrderByWithRelationInput | Prisma.MarketplaceTemplateOrderByWithRelationInput[] = { createdAt: 'desc' };
      
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'newest':
            orderBy = { createdAt: 'desc' };
            break;
          case 'popular':
            orderBy = [{ downloads: 'desc' }, { likes: 'desc' }];
            break;
          case 'rating':
            orderBy = [{ averageRating: 'desc' }, { reviews: 'desc' }];
            break;
          case 'price':
            orderBy = { priceCents: 'asc' };
            break;
          case 'downloads':
            orderBy = { downloads: 'desc' };
            break;
        }
      }

      // ✅ Compter le total et récupérer les templates en parallèle
      const [total, templates] = await Promise.all([
        this.prisma.marketplaceTemplate.count({ where }),
        this.prisma.marketplaceTemplate.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
      ]);

      return {
        templates: templates as unknown as MarketplaceTemplate[],
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to search templates: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Publie un template
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRawUnsafe
   */
  async publishTemplate(templateId: string): Promise<MarketplaceTemplate> {
    // ✅ Validation
    if (!templateId || typeof templateId !== 'string' || templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    const cleanTemplateId = templateId.trim();

    try {
      // ✅ Vérifier que le template existe
      const existing = await this.prisma.marketplaceTemplate.findUnique({
        where: { id: cleanTemplateId },
      });

      if (!existing) {
        throw new NotFoundException(`Template ${templateId} not found`);
      }

      // ✅ Publier le template
      const template = await this.prisma.marketplaceTemplate.update({
        where: { id: cleanTemplateId },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      });

      this.logger.log(`Template ${templateId} published`);

      return template as unknown as MarketplaceTemplate;
    } catch (error) {
      this.logger.error(
        `Failed to publish template: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
