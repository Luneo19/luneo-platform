import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface UpdateWidgetConfigInput {
  theme?: Partial<WidgetTheme>;
  logo?: string;
  ctaText?: string;
  ctaAction?: string;
  ctaUrl?: string;
  showPoweredBy?: boolean;
  customCss?: string;
  allowedDomains?: string[];
  locale?: string;
  translations?: Record<string, string>;
  analyticsEnabled?: boolean;
  showRecommendations?: boolean;
  showSocialShare?: boolean;
}

const APP_URL = process.env.APP_URL || 'https://app.luneo.com';

@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create widget configuration for a brand.
   */
  async getWidgetConfig(brandSlug: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { slug: brandSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        whiteLabel: true,
        subscriptionPlan: true,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand "${brandSlug}" not found`);
    }

    let config = await this.prisma.tryOnWidgetConfig.findUnique({
      where: { brandId: brand.id },
    });

    // Auto-create default config if not exists
    if (!config) {
      config = await this.prisma.tryOnWidgetConfig.create({
        data: {
          brandId: brand.id,
          logo: brand.logo,
          allowedDomains: [],
        },
      });
    }

    // Premium features gating
    const isPremium = brand.whiteLabel || ['BUSINESS', 'ENTERPRISE'].includes(brand.subscriptionPlan);

    return {
      ...config,
      theme: config.theme as unknown as WidgetTheme,
      translations: config.translations as Record<string, string> | null,
      brand: {
        name: brand.name,
        slug: brand.slug,
      },
      features: {
        showPoweredBy: isPremium ? config.showPoweredBy : true,
        customCssEnabled: isPremium,
        whiteLabel: isPremium,
      },
    };
  }

  /**
   * Update widget configuration (dashboard admin).
   */
  async updateWidgetConfig(brandId: string, input: UpdateWidgetConfigInput) {
    const existing = await this.prisma.tryOnWidgetConfig.findUnique({
      where: { brandId },
    });

    // Merge theme if partial
    let mergedTheme: Prisma.InputJsonValue | undefined;
    if (input.theme) {
      const currentTheme = (existing?.theme as Record<string, string>) || {};
      mergedTheme = { ...currentTheme, ...input.theme };
    }

    const config = await this.prisma.tryOnWidgetConfig.upsert({
      where: { brandId },
      update: {
        ...(mergedTheme && { theme: mergedTheme }),
        ...(input.logo !== undefined && { logo: input.logo }),
        ...(input.ctaText && { ctaText: input.ctaText }),
        ...(input.ctaAction && { ctaAction: input.ctaAction }),
        ...(input.ctaUrl !== undefined && { ctaUrl: input.ctaUrl }),
        ...(input.showPoweredBy !== undefined && {
          showPoweredBy: input.showPoweredBy,
        }),
        ...(input.customCss !== undefined && { customCss: input.customCss }),
        ...(input.allowedDomains && {
          allowedDomains: input.allowedDomains,
        }),
        ...(input.locale && { locale: input.locale }),
        ...(input.translations && {
          translations: input.translations as Prisma.InputJsonValue,
        }),
        ...(input.analyticsEnabled !== undefined && {
          analyticsEnabled: input.analyticsEnabled,
        }),
        ...(input.showRecommendations !== undefined && {
          showRecommendations: input.showRecommendations,
        }),
        ...(input.showSocialShare !== undefined && {
          showSocialShare: input.showSocialShare,
        }),
      },
      create: {
        brandId,
        allowedDomains: input.allowedDomains || [],
        ...(mergedTheme && { theme: mergedTheme }),
        ...(input.logo && { logo: input.logo }),
        ...(input.ctaText && { ctaText: input.ctaText }),
        ...(input.locale && { locale: input.locale }),
      },
    });

    this.logger.log(`Widget config updated for brand ${brandId}`);
    return config;
  }

  /**
   * Validate that a request origin is authorized for this brand's widget.
   */
  async validateDomain(brandSlug: string, origin: string): Promise<boolean> {
    const config = await this.prisma.tryOnWidgetConfig.findFirst({
      where: { brand: { slug: brandSlug } },
      select: { allowedDomains: true },
    });

    if (!config || config.allowedDomains.length === 0) {
      return true; // No domain restrictions
    }

    try {
      const url = new URL(origin);
      return config.allowedDomains.some(
        (d) => url.hostname === d || url.hostname.endsWith(`.${d}`),
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate embed code snippets for a brand.
   */
  generateEmbedCode(brandSlug: string, productId: string) {
    const widgetUrl = `${APP_URL}/widget/${brandSlug}/${productId}`;

    return {
      iframe: `<iframe src="${widgetUrl}" width="400" height="600" frameborder="0" allow="camera; microphone" style="border-radius: 12px; overflow: hidden;"></iframe>`,
      script: `<div id="luneo-tryon" data-brand="${brandSlug}" data-product="${productId}"></div>\n<script src="${APP_URL}/widget.js" async></script>`,
      react: `import { TryOnWidget } from '@luneo/react';\n\n<TryOnWidget brandSlug="${brandSlug}" productId="${productId}" />`,
    };
  }
}
