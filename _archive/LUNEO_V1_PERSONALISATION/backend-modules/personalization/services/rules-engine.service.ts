import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface ZoneRule {
  zoneId: string;
  maxChars?: number;
  minChars?: number;
  allowedFonts?: string[];
  allowedColors?: string[];
  allowedPatterns?: string[];
  required?: boolean;
  allowNonAscii?: boolean;
}

export interface ZoneInputValue {
  text?: string;
  font?: string;
  color?: string;
  pattern?: string;
  size?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ zoneId: string; error: string }>;
  warnings: Array<{ zoneId: string; warning: string }>;
}

@Injectable()
export class RulesEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer les règles d'un produit
   */
  async getProductRules(productId: string): Promise<ZoneRule[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        zones: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      return [];
    }

    return product.zones.map(zone => ({
      zoneId: zone.id,
      maxChars: zone.maxChars || undefined,
      minChars: undefined, // Pas de minChars dans Zone actuellement
      allowedFonts: zone.allowedFonts.length > 0 ? zone.allowedFonts : undefined,
      allowedColors: zone.allowedColors.length > 0 ? zone.allowedColors : undefined,
      allowedPatterns: zone.allowedPatterns.length > 0 ? zone.allowedPatterns : undefined,
      required: zone.isRequired || false,
      allowNonAscii: true, // Par défaut, permettre non-ASCII
    }));
  }

  /**
   * Valider des inputs de zones contre les règles du produit
   */
  async validateZoneInputs(
    productId: string,
    zoneInputs: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const rules = await this.getProductRules(productId);
    const errors: Array<{ zoneId: string; error: string }> = [];
    const warnings: Array<{ zoneId: string; warning: string }> = [];

    // Vérifier chaque zone
    for (const rule of rules) {
      const input = zoneInputs[rule.zoneId] as ZoneInputValue | undefined;

      // Si zone requise et input manquant
      if (rule.required && (!input || !input.text)) {
        errors.push({
          zoneId: rule.zoneId,
          error: 'This zone is required',
        });
        continue;
      }

      // Si input fourni, valider
      if (input && input.text) {
        const text = input.text;

        // Vérifier longueur max
        if (rule.maxChars && text.length > rule.maxChars) {
          errors.push({
            zoneId: rule.zoneId,
            error: `Text exceeds maximum length of ${rule.maxChars} characters`,
          });
        }

        // Vérifier font
        if (rule.allowedFonts && input.font && !rule.allowedFonts.includes(input.font)) {
          errors.push({
            zoneId: rule.zoneId,
            error: `Font "${input.font}" is not allowed. Allowed fonts: ${rule.allowedFonts.join(', ')}`,
          });
        }

        // Vérifier color
        if (rule.allowedColors && input.color && !rule.allowedColors.includes(input.color)) {
          errors.push({
            zoneId: rule.zoneId,
            error: `Color "${input.color}" is not allowed. Allowed colors: ${rule.allowedColors.join(', ')}`,
          });
        }

        // Vérifier pattern
        if (rule.allowedPatterns && input.pattern && !rule.allowedPatterns.includes(input.pattern)) {
          errors.push({
            zoneId: rule.zoneId,
            error: `Pattern "${input.pattern}" is not allowed. Allowed patterns: ${rule.allowedPatterns.join(', ')}`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Appliquer les règles par défaut (font, color, size) si non fournies
   */
  async applyDefaults(
    productId: string,
    zoneInputs: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const rules = await this.getProductRules(productId);
    const normalized: Record<string, unknown> = { ...zoneInputs };

    for (const rule of rules) {
      if (!normalized[rule.zoneId]) {
        normalized[rule.zoneId] = {};
      }

      const input = normalized[rule.zoneId] as Record<string, unknown>;
      const zone = await this.prisma.zone.findUnique({
        where: { id: rule.zoneId },
        select: { defaultFont: true, defaultColor: true, defaultSize: true },
      });

      if (zone) {
        const out = normalized[rule.zoneId] as Record<string, unknown>;
        if (!input.font && zone.defaultFont) out.font = zone.defaultFont;
        if (!input.color && zone.defaultColor) out.color = zone.defaultColor;
        if (input.size == null && zone.defaultSize != null) out.size = zone.defaultSize;
      }
    }

    return normalized;
  }
}











