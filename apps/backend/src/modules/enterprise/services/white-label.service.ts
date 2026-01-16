/**
 * @fileoverview Service de white-label pour Enterprise
 * @module WhiteLabelService
 *
 * Conforme au plan PHASE 8 - Enterprise - White-label solutions
 *
 * FONCTIONNALITÉS:
 * - Gestion des thèmes personnalisés
 * - Gestion des domaines personnalisés
 * - Gestion des assets personnalisés (logos, favicons)
 * - Configuration CSS personnalisée
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
 * Données de création de thème
 */
export interface CreateThemeData {
  brandId: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily?: string;
  borderRadius?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

/**
 * Données de création de domaine personnalisé
 */
export interface CreateCustomDomainData {
  brandId: string;
  domain: string;
  sslCertificate?: string;
  sslExpiresAt?: Date;
}

/**
 * Thème personnalisé
 */
export interface CustomTheme {
  id: string;
  brandId: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domaine personnalisé
 */
export interface CustomDomain {
  id: string;
  brandId: string;
  domain: string;
  isActive: boolean;
  sslCertificate?: string;
  sslExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Crée un thème personnalisé
   * Conforme au plan PHASE 8 - White-label
   */
  async createTheme(data: CreateThemeData): Promise<CustomTheme> {
    // ✅ Validation
    if (!data.brandId || typeof data.brandId !== 'string' || data.brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new BadRequestException('Theme name is required');
    }

    // ✅ Validation des couleurs (format hex)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colors = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor'];
    for (const colorKey of colors) {
      if (!data[colorKey as keyof CreateThemeData] || !colorRegex.test(data[colorKey as keyof CreateThemeData] as string)) {
        throw new BadRequestException(`Invalid color format for ${colorKey}. Must be hex format (e.g., #FF5733)`);
      }
    }

    // ✅ Vérifier que le brand existe
    const brand = await this.prisma.brand.findUnique({
      where: { id: data.brandId.trim() },
      select: { id: true, whiteLabel: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${data.brandId} not found`);
    }

    if (!brand.whiteLabel) {
      throw new BadRequestException('White-label is not enabled for this brand');
    }

    try {
      // ✅ Créer le thème
      const theme = await this.prisma.$executeRaw`
        INSERT INTO "CustomTheme" (
          "id", "brandId", "name", "primaryColor", "secondaryColor", "accentColor",
          "backgroundColor", "textColor", "fontFamily", "borderRadius",
          "logoUrl", "faviconUrl", "customCss", "isActive",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.brandId.trim()},
          ${data.name.trim()},
          ${data.primaryColor.trim()},
          ${data.secondaryColor.trim()},
          ${data.accentColor.trim()},
          ${data.backgroundColor.trim()},
          ${data.textColor.trim()},
          ${data.fontFamily || 'Inter'},
          ${data.borderRadius || '8px'},
          ${data.logoUrl || null},
          ${data.faviconUrl || null},
          ${data.customCss || null},
          true,
          NOW(), NOW()
        )
        RETURNING *
      `;

      this.logger.log(`Custom theme created: ${data.name} for brand ${data.brandId}`);

      // ✅ Invalider le cache
      await this.cache.invalidateTags([`white-label:theme:${data.brandId}`]);

      // ✅ Récupérer le thème créé
      return this.getActiveTheme(data.brandId.trim());
    } catch (error) {
      this.logger.error(
        `Failed to create custom theme: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient le thème actif d'un brand
   */
  async getActiveTheme(brandId: string): Promise<CustomTheme> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    // ✅ Récupérer le thème (le cache sera géré automatiquement si nécessaire)
    const themes = await this.prisma.$queryRawUnsafe<CustomTheme[]>(
      `SELECT * FROM "CustomTheme" WHERE "brandId" = $1 AND "isActive" = true ORDER BY "createdAt" DESC LIMIT 1`,
      brandId.trim(),
    );

    if (!themes || themes.length === 0) {
      throw new NotFoundException(`No active theme found for brand ${brandId}`);
    }

    return themes[0];
  }

  /**
   * Crée un domaine personnalisé
   */
  async createCustomDomain(data: CreateCustomDomainData): Promise<CustomDomain> {
    // ✅ Validation
    if (!data.brandId || typeof data.brandId !== 'string' || data.brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!data.domain || typeof data.domain !== 'string' || data.domain.trim().length === 0) {
      throw new BadRequestException('Domain is required');
    }

    // ✅ Validation du format de domaine
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(data.domain.trim())) {
      throw new BadRequestException('Invalid domain format');
    }

    // ✅ Vérifier que le brand existe et a white-label activé
    const brand = await this.prisma.brand.findUnique({
      where: { id: data.brandId.trim() },
      select: { id: true, whiteLabel: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${data.brandId} not found`);
    }

    if (!brand.whiteLabel) {
      throw new BadRequestException('White-label is not enabled for this brand');
    }

    // ✅ Vérifier que le domaine n'est pas déjà pris
    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "CustomDomain" WHERE "domain" = $1 LIMIT 1`,
      data.domain.trim().toLowerCase(),
    );

    if (existing && existing.length > 0) {
      throw new BadRequestException('Domain already taken');
    }

    try {
      // ✅ Créer le domaine
      const domain = await this.prisma.$executeRaw`
        INSERT INTO "CustomDomain" (
          "id", "brandId", "domain", "isActive",
          "sslCertificate", "sslExpiresAt",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.brandId.trim()},
          ${data.domain.trim().toLowerCase()},
          false, -- Inactif par défaut jusqu'à vérification SSL
          ${data.sslCertificate || null},
          ${data.sslExpiresAt || null},
          NOW(), NOW()
        )
        RETURNING *
      `;

      this.logger.log(`Custom domain created: ${data.domain} for brand ${data.brandId}`);

      // ✅ Récupérer le domaine créé
      const domains = await this.prisma.$queryRawUnsafe<CustomDomain[]>(
        `SELECT * FROM "CustomDomain" WHERE "id" = $1 LIMIT 1`,
        (domain as any).id,
      );

      if (!domains || domains.length === 0) {
        throw new Error('Failed to retrieve created domain');
      }

      return domains[0];
    } catch (error) {
      this.logger.error(
        `Failed to create custom domain: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Active un domaine personnalisé (après vérification SSL)
   */
  async activateDomain(domainId: string): Promise<CustomDomain> {
    // ✅ Validation
    if (!domainId || typeof domainId !== 'string' || domainId.trim().length === 0) {
      throw new BadRequestException('Domain ID is required');
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "CustomDomain" SET "isActive" = true, "updatedAt" = NOW() WHERE "id" = $1`,
        domainId.trim(),
      );

      this.logger.log(`Custom domain ${domainId} activated`);

      // ✅ Récupérer le domaine mis à jour
      const domains = await this.prisma.$queryRawUnsafe<CustomDomain[]>(
        `SELECT * FROM "CustomDomain" WHERE "id" = $1 LIMIT 1`,
        domainId.trim(),
      );

      if (!domains || domains.length === 0) {
        throw new NotFoundException(`Domain ${domainId} not found`);
      }

      return domains[0];
    } catch (error) {
      this.logger.error(
        `Failed to activate domain: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
