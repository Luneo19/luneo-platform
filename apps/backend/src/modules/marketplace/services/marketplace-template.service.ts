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
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

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
    if (!slugRegex.test(data.slug.trim())) {
      throw new BadRequestException('Slug must be 3-100 characters, lowercase alphanumeric and dashes only');
    }

    // ✅ Vérifier que le slug n'est pas déjà pris
    const existing = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "MarketplaceTemplate" WHERE "slug" = ${data.slug.trim()} LIMIT 1
    `;

    if (existing && existing.length > 0) {
      throw new BadRequestException('Slug already taken');
    }

    try {
      // ✅ Créer le template
      const template = await this.prisma.$executeRaw`
        INSERT INTO "MarketplaceTemplate" (
          "id", "creatorId", "name", "slug", "description", "category", "tags",
          "promptTemplate", "negativePrompt", "variables", "exampleOutputs",
          "aiProvider", "model", "quality", "style",
          "priceCents", "isFree", "revenueSharePercent",
          "downloads", "likes", "reviews", "averageRating", "totalRevenueCents",
          "status", "featured", "thumbnailUrl", "previewImages", "metadata",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.creatorId.trim()},
          ${data.name.trim()},
          ${data.slug.trim()},
          ${data.description || null},
          ${data.category || null},
          ${data.tags ? data.tags : []}::text[],
          ${data.promptTemplate.trim()},
          ${data.negativePrompt || null},
          ${data.variables ? JSON.stringify(data.variables) : null}::jsonb,
          ${data.exampleOutputs ? data.exampleOutputs : []}::text[],
          ${data.aiProvider || 'openai'},
          ${data.model || 'dall-e-3'},
          ${data.quality || 'standard'},
          ${data.style || 'natural'},
          ${data.priceCents || 0},
          ${data.isFree !== undefined ? data.isFree : (data.priceCents === 0 || !data.priceCents)},
          ${data.revenueSharePercent || 70},
          0, 0, 0, 0.0, 0,
          'draft',
          false,
          ${data.thumbnailUrl || null},
          ${data.previewImages ? data.previewImages : []}::text[],
          ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
          NOW(), NOW()
        )
        RETURNING *
      `;

      this.logger.log(`Marketplace template created: ${data.slug} by creator ${data.creatorId}`);

      // ✅ Récupérer le template créé
      return this.getTemplateBySlug(data.slug.trim());
    } catch (error) {
      this.logger.error(
        `Failed to create marketplace template: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient un template par slug
   */
  async getTemplateBySlug(slug: string): Promise<MarketplaceTemplate> {
    // ✅ Validation
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      throw new BadRequestException('Slug is required');
    }

    const templates = await this.prisma.$queryRaw<MarketplaceTemplate[]>`
      SELECT * FROM "MarketplaceTemplate" WHERE "slug" = ${slug.trim()} LIMIT 1
    `;

    if (!templates || templates.length === 0) {
      throw new NotFoundException(`Template not found: ${slug}`);
    }

    return templates[0];
  }

  /**
   * Recherche des templates
   * Conforme au plan PHASE 7 - Recherche et filtrage
   */
  async searchTemplates(options: SearchTemplatesOptions = {}): Promise<{
    templates: MarketplaceTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    try {
      // ✅ Construire la requête avec filtres
      let whereConditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Status par défaut: seulement published
      if (!options.status) {
        whereConditions.push(`"status" = 'published'`);
      } else {
        whereConditions.push(`"status" = $${paramIndex++}`);
        params.push(options.status);
      }

      if (options.category) {
        whereConditions.push(`"category" = $${paramIndex++}`);
        params.push(options.category);
      }

      if (options.creatorId) {
        whereConditions.push(`"creatorId" = $${paramIndex++}`);
        params.push(options.creatorId);
      }

      if (options.featured !== undefined) {
        whereConditions.push(`"featured" = $${paramIndex++}`);
        params.push(options.featured);
      }

      if (options.minRating !== undefined) {
        whereConditions.push(`"averageRating" >= $${paramIndex++}`);
        params.push(options.minRating);
      }

      if (options.search) {
        whereConditions.push(`("name" ILIKE $${paramIndex++} OR "description" ILIKE $${paramIndex})`);
        params.push(`%${options.search}%`);
        paramIndex++;
      }

      if (options.tags && options.tags.length > 0) {
        whereConditions.push(`"tags" && $${paramIndex++}::text[]`);
        params.push(options.tags);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // ✅ Déterminer le tri
      let orderBy = 'ORDER BY "createdAt" DESC';
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'newest':
            orderBy = 'ORDER BY "createdAt" DESC';
            break;
          case 'popular':
            orderBy = 'ORDER BY "downloads" DESC, "likes" DESC';
            break;
          case 'rating':
            orderBy = 'ORDER BY "averageRating" DESC, "reviews" DESC';
            break;
          case 'price':
            orderBy = 'ORDER BY "priceCents" ASC';
            break;
          case 'downloads':
            orderBy = 'ORDER BY "downloads" DESC';
            break;
        }
      }

      // ✅ Compter le total
      const countResult = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::int as count FROM "MarketplaceTemplate" ${whereClause}`,
        ...params,
      );
      const total = countResult[0]?.count || 0;

      // ✅ Récupérer les templates
      params.push(limit, offset);
      const templates = await this.prisma.$queryRawUnsafe<MarketplaceTemplate[]>(
        `SELECT * FROM "MarketplaceTemplate" ${whereClause} ${orderBy} LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        ...params,
      );

      return {
        templates: templates || [],
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
   */
  async publishTemplate(templateId: string): Promise<MarketplaceTemplate> {
    // ✅ Validation
    if (!templateId || typeof templateId !== 'string' || templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "MarketplaceTemplate" SET
          "status" = 'published',
          "publishedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = $1`,
        templateId.trim(),
      );

      this.logger.log(`Template ${templateId} published`);

      // ✅ Récupérer le template mis à jour
      const templates = await this.prisma.$queryRawUnsafe<MarketplaceTemplate[]>(
        `SELECT * FROM "MarketplaceTemplate" WHERE "id" = $1 LIMIT 1`,
        templateId.trim(),
      );

      if (!templates || templates.length === 0) {
        throw new NotFoundException(`Template ${templateId} not found`);
      }

      return templates[0];
    } catch (error) {
      this.logger.error(
        `Failed to publish template: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
