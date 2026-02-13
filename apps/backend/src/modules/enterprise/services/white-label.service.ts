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
 * - ✅ SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
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
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRaw
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

    const cleanBrandId = data.brandId.trim();

    // ✅ Vérifier que le brand existe
    const brand = await this.prisma.brand.findUnique({
      where: { id: cleanBrandId },
      select: { id: true, whiteLabel: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${data.brandId} not found`);
    }

    if (!brand.whiteLabel) {
      throw new BadRequestException('White-label is not enabled for this brand');
    }

    try {
      // ✅ Désactiver les thèmes précédents pour ce brand
      await this.prisma.customTheme.updateMany({
        where: { brandId: cleanBrandId, isActive: true },
        data: { isActive: false },
      });

      // ✅ Créer le thème avec Prisma
      const theme = await this.prisma.customTheme.create({
        data: {
          brandId: cleanBrandId,
          name: data.name.trim(),
          primaryColor: data.primaryColor.trim(),
          secondaryColor: data.secondaryColor.trim(),
          accentColor: data.accentColor.trim(),
          backgroundColor: data.backgroundColor.trim(),
          textColor: data.textColor.trim(),
          fontFamily: data.fontFamily || 'Inter',
          borderRadius: data.borderRadius || '8px',
          logoUrl: data.logoUrl || null,
          faviconUrl: data.faviconUrl || null,
          customCss: data.customCss || null,
          isActive: true,
        },
      });

      this.logger.log(`Custom theme created: ${data.name} for brand ${data.brandId}`);

      // ✅ Invalider le cache
      await this.cache.invalidateTags([`white-label:theme:${data.brandId}`]);

      return theme as CustomTheme;
    } catch (error) {
      this.logger.error(
        `Failed to create custom theme: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient le thème actif d'un brand
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async getActiveTheme(brandId: string): Promise<CustomTheme> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    const cleanBrandId = brandId.trim();

    // ✅ Récupérer le thème actif avec Prisma
    const theme = await this.prisma.customTheme.findFirst({
      where: {
        brandId: cleanBrandId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!theme) {
      throw new NotFoundException(`No active theme found for brand ${brandId}`);
    }

    return theme as CustomTheme;
  }

  /**
   * Crée un domaine personnalisé
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
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

    const cleanBrandId = data.brandId.trim();
    const cleanDomain = data.domain.trim().toLowerCase();

    // ✅ Vérifier que le brand existe et a white-label activé
    const brand = await this.prisma.brand.findUnique({
      where: { id: cleanBrandId },
      select: { id: true, whiteLabel: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${data.brandId} not found`);
    }

    if (!brand.whiteLabel) {
      throw new BadRequestException('White-label is not enabled for this brand');
    }

    // ✅ Vérifier que le domaine n'est pas déjà pris (contrainte unique sur domain)
    const existing = await this.prisma.customDomain.findUnique({
      where: { domain: cleanDomain },
    });

    if (existing) {
      throw new BadRequestException('Domain already taken');
    }

    try {
      // ✅ Créer le domaine avec Prisma
      const domain = await this.prisma.customDomain.create({
        data: {
          brandId: cleanBrandId,
          domain: cleanDomain,
          isActive: false, // Inactif par défaut jusqu'à vérification SSL
          sslCertificate: data.sslCertificate || null,
          sslExpiresAt: data.sslExpiresAt || null,
        },
      });

      this.logger.log(`Custom domain created: ${data.domain} for brand ${data.brandId}`);

      return domain as CustomDomain;
    } catch (error) {
      this.logger.error(
        `Failed to create custom domain: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Active un domaine personnalisé (après vérification SSL)
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRawUnsafe
   */
  async activateDomain(domainId: string): Promise<CustomDomain> {
    // ✅ Validation
    if (!domainId || typeof domainId !== 'string' || domainId.trim().length === 0) {
      throw new BadRequestException('Domain ID is required');
    }

    const cleanDomainId = domainId.trim();

    try {
      // ✅ Vérifier que le domaine existe
      const existing = await this.prisma.customDomain.findUnique({
        where: { id: cleanDomainId },
      });

      if (!existing) {
        throw new NotFoundException(`Domain ${domainId} not found`);
      }

      // ✅ Activer le domaine
      const domain = await this.prisma.customDomain.update({
        where: { id: cleanDomainId },
        data: { isActive: true },
      });

      this.logger.log(`Custom domain ${domainId} activated`);

      return domain as CustomDomain;
    } catch (error) {
      this.logger.error(
        `Failed to activate domain: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Get active theme by custom domain (for frontend theme provider on domain match)
   */
  async getActiveThemeByDomain(domain: string): Promise<CustomTheme | null> {
    if (!domain || typeof domain !== 'string') return null;
    const cleanDomain = domain.trim().toLowerCase();
    const customDomain = await this.prisma.customDomain.findFirst({
      where: { domain: cleanDomain, isActive: true },
      select: { brandId: true },
    });
    if (!customDomain) return null;
    try {
      return await this.getActiveTheme(customDomain.brandId);
    } catch {
      return null;
    }
  }
}
