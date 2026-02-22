/**
 * @fileoverview Service de white-label pour Enterprise
 * @module WhiteLabelService
 *
 * Conforme au plan PHASE 8 - Enterprise - White-label solutions
 *
 * V2 MIGRATION NOTE:
 * The V1 models (Brand, CustomTheme, CustomDomain) no longer exist in the Prisma schema.
 * V2 uses Organization instead of Brand. CustomTheme and CustomDomain are not yet modeled.
 * All methods are stubbed to return graceful fallbacks (null / empty) until the
 * white-label tables are re-introduced in a future migration.
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

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

export interface CreateCustomDomainData {
  brandId: string;
  domain: string;
  sslCertificate?: string;
  sslExpiresAt?: Date;
}

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
   * Crée un thème personnalisé.
   * STUBBED: CustomTheme model does not exist in V2 schema yet.
   * Validates input but returns a synthetic object instead of persisting.
   */
  async createTheme(data: CreateThemeData): Promise<CustomTheme> {
    if (!data.brandId || typeof data.brandId !== 'string' || data.brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new BadRequestException('Theme name is required');
    }

    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colors = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor'];
    for (const colorKey of colors) {
      if (!data[colorKey as keyof CreateThemeData] || !colorRegex.test(data[colorKey as keyof CreateThemeData] as string)) {
        throw new BadRequestException(`Invalid color format for ${colorKey}. Must be hex format (e.g., #FF5733)`);
      }
    }

    const cleanBrandId = data.brandId.trim();

    // V2: verify organization exists instead of brand
    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: cleanBrandId },
        select: { id: true },
      });

      if (!org) {
        throw new NotFoundException(`Organization ${data.brandId} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`Could not verify organization existence: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    this.logger.warn('createTheme is stubbed — CustomTheme model not available in V2 schema');

    const now = new Date();
    return {
      id: `stub-theme-${Date.now()}`,
      brandId: cleanBrandId,
      name: data.name.trim(),
      primaryColor: data.primaryColor.trim(),
      secondaryColor: data.secondaryColor.trim(),
      accentColor: data.accentColor.trim(),
      backgroundColor: data.backgroundColor.trim(),
      textColor: data.textColor.trim(),
      fontFamily: data.fontFamily || 'Inter',
      borderRadius: data.borderRadius || '8px',
      logoUrl: data.logoUrl || undefined,
      faviconUrl: data.faviconUrl || undefined,
      customCss: data.customCss || undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Obtient le thème actif d'un brand/organization.
   * STUBBED: returns null — no CustomTheme table in V2.
   */
  async getActiveTheme(brandId: string): Promise<CustomTheme | null> {
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    this.logger.debug(`getActiveTheme called for ${brandId} — returning null (stubbed, no CustomTheme in V2)`);
    return null;
  }

  /**
   * Crée un domaine personnalisé.
   * STUBBED: CustomDomain model does not exist in V2 schema yet.
   */
  async createCustomDomain(data: CreateCustomDomainData): Promise<CustomDomain> {
    if (!data.brandId || typeof data.brandId !== 'string' || data.brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    if (!data.domain || typeof data.domain !== 'string' || data.domain.trim().length === 0) {
      throw new BadRequestException('Domain is required');
    }

    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(data.domain.trim())) {
      throw new BadRequestException('Invalid domain format');
    }

    const cleanBrandId = data.brandId.trim();
    const cleanDomain = data.domain.trim().toLowerCase();

    // V2: verify organization exists instead of brand
    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: cleanBrandId },
        select: { id: true },
      });

      if (!org) {
        throw new NotFoundException(`Organization ${data.brandId} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`Could not verify organization existence: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    this.logger.warn('createCustomDomain is stubbed — CustomDomain model not available in V2 schema');

    const now = new Date();
    return {
      id: `stub-domain-${Date.now()}`,
      brandId: cleanBrandId,
      domain: cleanDomain,
      isActive: false,
      sslCertificate: data.sslCertificate || undefined,
      sslExpiresAt: data.sslExpiresAt || undefined,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Active un domaine personnalisé (après vérification SSL).
   * STUBBED: returns null — no CustomDomain table in V2.
   */
  async activateDomain(domainId: string): Promise<CustomDomain | null> {
    if (!domainId || typeof domainId !== 'string' || domainId.trim().length === 0) {
      throw new BadRequestException('Domain ID is required');
    }

    this.logger.warn(`activateDomain called for ${domainId} — stubbed, no CustomDomain in V2`);
    return null;
  }

  /**
   * Get active theme by custom domain (public endpoint for frontend theme provider).
   * Returns null — no CustomDomain / CustomTheme tables in V2 schema.
   */
  async getActiveThemeByDomain(domain: string): Promise<CustomTheme | null> {
    if (!domain || typeof domain !== 'string') return null;
    this.logger.debug(`getActiveThemeByDomain called for "${domain}" — returning null (no CustomDomain in V2)`);
    return null;
  }
}
