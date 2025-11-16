import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import {
  ProductRules,
  ProductZone,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ZoneValidationContext,
  CompatibilityRule,
  CompatibilityCondition,
  DesignOptions,
  DesignZoneOption,
  DesignImageZoneOptions,
  DesignTextZoneOptions,
  DesignColorZoneOptions,
  DesignSelectZoneOptions,
  PricingRules,
  RulesUsageStats,
} from '../interfaces/product-rules.interface';

@Injectable()
export class ProductRulesService {
  private readonly logger = new Logger(ProductRulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Récupère les règles d'un produit
   */
  async getProductRules(productId: string): Promise<ProductRules | null> {
    const cacheKey = `product_rules:${productId}`;
    
    // Vérifier le cache d'abord
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return cached as ProductRules;
    }

    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { 
          id: true,
          rulesJson: true,
          brandId: true,
          name: true 
        },
      });

      if (!product || !product.rulesJson) {
        return null;
      }

      const rules = this.parseProductRules(product.rulesJson);

      await this.cache.setSimple(cacheKey, rules, 3600);

      return rules;
    } catch (error) {
      this.logger.error(`Error fetching product rules for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour les règles d'un produit
   */
  async updateProductRules(productId: string, rules: ProductRules): Promise<ProductRules> {
    try {
      // Valider les règles avant sauvegarde
      this.validateRulesStructure(rules);

      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: this.serializeRules(rules) },
        select: { id: true, rulesJson: true },
      });

      // Invalider le cache
      await this.cache.delSimple(`product_rules:${productId}`);
      
      // Mettre en cache les nouvelles règles
      const parsedRules = this.parseProductRules(updatedProduct.rulesJson);

      await this.cache.setSimple(`product_rules:${productId}`, parsedRules, 3600);

      return parsedRules;
    } catch (error) {
      this.logger.error(`Error updating product rules for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Valide les options de design contre les règles du produit
   */
  async validateDesignOptions(context: ZoneValidationContext): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      const zoneOptionsMap = context.options.zones ?? {};

      for (const zone of context.rules.zones) {
        const zoneOption = zoneOptionsMap[zone.id];
        
        if (!zoneOption && zone.constraints?.required) {
          errors.push({
            code: 'ZONE_REQUIRED',
            message: `La zone "${zone.label}" est obligatoire`,
            zone: zone.id,
            severity: 'error'
          });
          continue;
        }

        if (zoneOption) {
          const zoneValidation = this.validateZone(zone, zoneOption);
          errors.push(...zoneValidation.errors);
          warnings.push(...zoneValidation.warnings);
        }
      }

      // Valider les règles de compatibilité
      const compatibilityValidation = this.validateCompatibilityRules(
        context.rules.compatibilityRules || [],
        context.options
      );
      errors.push(...compatibilityValidation.errors);
      warnings.push(...compatibilityValidation.warnings);

      // Valider les contraintes globales
      const globalValidation = this.validateGlobalConstraints(
        context.rules.globalConstraints,
        context.options
      );
      errors.push(...globalValidation.errors);
      warnings.push(...globalValidation.warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        price: 0, // Sera calculé par le PricingEngine
      };
    } catch (error) {
      this.logger.error('Error validating design options:', error);
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Erreur lors de la validation',
          severity: 'error'
        }],
        warnings: [],
        price: 0,
      };
    }
  }

  /**
   * Valide une zone spécifique
   */
  private validateZone(zone: ProductZone, option: DesignZoneOption): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (zone.type) {
      case 'text':
        this.validateTextZone(zone, this.ensureTextZoneOptions(option), errors, warnings);
        break;
      case 'image':
        this.validateImageZone(zone, this.ensureImageZoneOptions(option), errors, warnings);
        break;
      case 'color':
        this.validateColorZone(zone, this.ensureColorZoneOptions(option), errors, warnings);
        break;
      case 'select':
        this.validateSelectZone(zone, this.ensureSelectZoneOptions(option), errors, warnings);
        break;
    }

    // Validation des contraintes
    if (zone.constraints) {
      this.validateZoneConstraints(zone, option, errors, warnings);
    }

    return { errors, warnings };
  }

  /**
   * Valide une zone de type texte
   */
  private validateTextZone(
    zone: ProductZone,
    options: DesignTextZoneOptions,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!options.text || typeof options.text !== 'string') {
      errors.push({
        code: 'INVALID_TEXT',
        message: `Le texte pour la zone "${zone.label}" est invalide`,
        zone: zone.id,
        severity: 'error'
      });
      return;
    }

    // Vérifier la longueur maximale
    if (zone.constraints?.maxChars && options.text.length > zone.constraints.maxChars) {
      errors.push({
        code: 'TEXT_TOO_LONG',
        message: `Le texte dépasse la limite de ${zone.constraints.maxChars} caractères`,
        zone: zone.id,
        severity: 'error'
      });
    }

    // Vérifier le pattern regex
    if (zone.constraints?.pattern) {
      const regex = new RegExp(zone.constraints.pattern);
      if (!regex.test(options.text)) {
        errors.push({
          code: 'TEXT_PATTERN_MISMATCH',
          message: `Le texte ne respecte pas le format requis`,
          zone: zone.id,
          severity: 'error'
        });
      }
    }

    // Vérifier les polices autorisées
    if (zone.constraints?.allowedFonts && options.font) {
      if (!zone.constraints.allowedFonts.includes(options.font)) {
        warnings.push({
          code: 'FONT_NOT_RECOMMENDED',
          message: `La police "${options.font}" n'est pas recommandée pour cette zone`,
          suggestion: `Utilisez une de ces polices: ${zone.constraints.allowedFonts.join(', ')}`
        });
      }
    }
  }

  /**
   * Valide une zone de type image
   */
  private validateImageZone(
    zone: ProductZone,
    options: DesignImageZoneOptions,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!options.imageUrl && !options.imageFile) {
      errors.push({
        code: 'IMAGE_REQUIRED',
        message: `Une image est requise pour la zone "${zone.label}"`,
        zone: zone.id,
        severity: 'error'
      });
      return;
    }

    // Vérifier le type MIME
    if (zone.allowedMime && options.mimeType) {
      if (!zone.allowedMime.includes(options.mimeType)) {
        errors.push({
          code: 'INVALID_IMAGE_FORMAT',
          message: `Format d'image non autorisé. Formats acceptés: ${zone.allowedMime.join(', ')}`,
          zone: zone.id,
          severity: 'error'
        });
      }
    }

    // Vérifier la résolution
    if (
      zone.maxResolution &&
      typeof options.width === 'number' &&
      typeof options.height === 'number'
    ) {
      if (options.width > zone.maxResolution.w || options.height > zone.maxResolution.h) {
        warnings.push({
          code: 'IMAGE_TOO_LARGE',
          message: `L'image dépasse la résolution recommandée`,
          suggestion: `Réduisez la taille à ${zone.maxResolution.w}x${zone.maxResolution.h}px maximum`
        });
      }
    }

    // Vérifier la transparence
    if (zone.constraints?.noTransparency && options.hasTransparency) {
      errors.push({
        code: 'TRANSPARENCY_NOT_ALLOWED',
        message: `La transparence n'est pas autorisée pour cette zone`,
        zone: zone.id,
        severity: 'error'
      });
    }
  }

  /**
   * Valide une zone de type couleur
   */
  private validateColorZone(
    zone: ProductZone,
    options: DesignColorZoneOptions,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!options.color) {
      errors.push({
        code: 'COLOR_REQUIRED',
        message: `Une couleur est requise pour la zone "${zone.label}"`,
        zone: zone.id,
        severity: 'error'
      });
      return;
    }

    // Vérifier les couleurs autorisées
    if (zone.constraints?.allowedColors) {
      if (!zone.constraints.allowedColors.includes(options.color)) {
        errors.push({
          code: 'COLOR_NOT_ALLOWED',
          message: `Cette couleur n'est pas autorisée`,
          zone: zone.id,
          severity: 'error'
        });
      }
    }
  }

  /**
   * Valide une zone de type sélection
   */
  private validateSelectZone(
    zone: ProductZone,
    options: DesignSelectZoneOptions,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!options.value) {
      errors.push({
        code: 'SELECTION_REQUIRED',
        message: `Une sélection est requise pour la zone "${zone.label}"`,
        zone: zone.id,
        severity: 'error'
      });
      return;
    }

    const metadataOptions = zone.metadata?.options;
    const allowedOptions = Array.isArray(metadataOptions)
      ? metadataOptions.filter((opt): opt is string => typeof opt === 'string')
      : [];

    if (allowedOptions.length > 0 && !allowedOptions.includes(options.value)) {
      errors.push({
        code: 'INVALID_SELECTION',
        message: `Cette option n'est pas disponible`,
        zone: zone.id,
        severity: 'error'
      });
    }
  }

  /**
   * Valide les contraintes d'une zone
   */
  private validateZoneConstraints(
    zone: ProductZone,
    option: DesignZoneOption,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!zone.constraints) return;

    const { width, height } = this.extractDimensions(option);

    if (
      zone.constraints.minSize &&
      width !== undefined &&
      height !== undefined &&
      (width < zone.constraints.minSize.w || height < zone.constraints.minSize.h)
    ) {
      errors.push({
        code: 'SIZE_TOO_SMALL',
        message: `La taille est trop petite. Minimum: ${zone.constraints.minSize.w}x${zone.constraints.minSize.h}px`,
        zone: zone.id,
        severity: 'error',
      });
    }

    if (
      zone.constraints.maxSize &&
      width !== undefined &&
      height !== undefined &&
      (width > zone.constraints.maxSize.w || height > zone.constraints.maxSize.h)
    ) {
      errors.push({
        code: 'SIZE_TOO_LARGE',
        message: `La taille est trop grande. Maximum: ${zone.constraints.maxSize.w}x${zone.constraints.maxSize.h}px`,
        zone: zone.id,
        severity: 'error',
      });
    }
  }

  /**
   * Valide les règles de compatibilité
   */
  private validateCompatibilityRules(
    rules: CompatibilityRule[],
    options: DesignOptions
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of rules) {
      if (this.evaluateRuleCondition(rule.if, options)) {
        // Vérifier les interdictions
        if (rule.deny) {
          for (const denied of rule.deny) {
            if (this.hasOption(options, denied)) {
              errors.push({
                code: 'COMPATIBILITY_VIOLATION',
                message: `Cette option n'est pas compatible avec les autres sélections`,
                severity: 'error'
              });
            }
          }
        }

        // Vérifier les exigences
        if (rule.require) {
          for (const required of rule.require) {
            if (!this.hasOption(options, required)) {
              errors.push({
                code: 'REQUIRED_OPTION',
                message: `Cette option est requise avec les autres sélections`,
                severity: 'error'
              });
            }
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Valide les contraintes globales
   */
  private validateGlobalConstraints(
    constraints: ProductRules['globalConstraints'],
    options: DesignOptions
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!constraints) return { errors, warnings };

    const quantity = typeof options.quantity === 'number' ? options.quantity : undefined;

    const minOrderQuantity = typeof constraints.minOrderQuantity === 'number'
      ? constraints.minOrderQuantity
      : undefined;
    if (minOrderQuantity !== undefined && quantity !== undefined && quantity < minOrderQuantity) {
      errors.push({
        code: 'MIN_QUANTITY_NOT_MET',
        message: `Quantité minimale: ${minOrderQuantity}`,
        severity: 'error',
      });
    }

    const maxOrderQuantity = typeof constraints.maxOrderQuantity === 'number'
      ? constraints.maxOrderQuantity
      : undefined;
    if (maxOrderQuantity !== undefined && quantity !== undefined && quantity > maxOrderQuantity) {
      errors.push({
        code: 'MAX_QUANTITY_EXCEEDED',
        message: `Quantité maximale: ${maxOrderQuantity}`,
        severity: 'error',
      });
    }

    return { errors, warnings };
  }

  /**
   * Évalue une condition de règle
   */
  private evaluateRuleCondition(condition: CompatibilityCondition, options: DesignOptions): boolean {
    for (const [key, value] of Object.entries(condition)) {
      if (!this.hasOptionValue(options, key, value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Vérifie si une option existe
   */
  private hasOption(options: DesignOptions, optionPath: string): boolean {
    const value = this.getOptionValue(options, optionPath);
    return value !== undefined && value !== null;
  }

  /**
   * Vérifie si une option a une valeur spécifique
   */
  private hasOptionValue(options: DesignOptions, optionPath: string, expectedValue: unknown): boolean {
    const value = this.getOptionValue(options, optionPath);

    if (typeof expectedValue === 'object' && expectedValue !== null) {
      return JSON.stringify(value) === JSON.stringify(expectedValue);
    }

    return value === expectedValue;
  }

  /**
   * Valide la structure des règles
   */
  private validateRulesStructure(rules: ProductRules): void {
    if (!rules.zones || !Array.isArray(rules.zones)) {
      throw new Error('Les règles doivent contenir un tableau de zones');
    }

    for (const zone of rules.zones) {
      if (!zone.id || !zone.label || !zone.type) {
        throw new Error('Chaque zone doit avoir un id, label et type');
      }

      if (!['image', 'text', 'color', 'select'].includes(zone.type)) {
        throw new Error(`Type de zone invalide: ${zone.type}`);
      }

      if (typeof zone.x !== 'number' || typeof zone.y !== 'number' ||
          typeof zone.width !== 'number' || typeof zone.height !== 'number') {
        throw new Error('Les coordonnées et dimensions de zone doivent être des nombres');
      }
    }
  }

  /**
   * Obtient les statistiques d'usage des règles
   */
  async getRulesUsageStats(
    productId: string,
    period: 'day' | 'week' | 'month' = 'week',
  ): Promise<RulesUsageStats> {
    const cacheKey = `rules_usage:${productId}:${period}`;
    
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return cached as RulesUsageStats;
    }

    try {
      // Calculer la période
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Statistiques d'usage des designs
      const designsStats = await this.prisma.design.groupBy({
        by: ['status'],
        where: {
          productId,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        _count: {
          status: true,
        },
      });

      // Statistiques des commandes
      const ordersStats = await this.prisma.order.count({
        where: {
          productId,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
      });

      const stats: RulesUsageStats = {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        designs: designsStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        orders: ordersStats,
      };

      await this.cache.setSimple(cacheKey, stats, 900);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error fetching rules usage stats for ${productId}:`, error);
      throw error;
    }
  }

  private getOptionValue(options: DesignOptions, optionPath: string): unknown {
    const keys = optionPath.split('.');
    let current: unknown = options;

    for (const key of keys) {
      if (typeof current === 'object' && current !== null && !Array.isArray(current) && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private parseProductRules(rulesJson: Prisma.JsonValue): ProductRules {
    if (!rulesJson || typeof rulesJson !== 'object' || Array.isArray(rulesJson)) {
      return { zones: [] };
    }

    const raw = rulesJson as Partial<ProductRules> & Record<string, unknown>;

    const zones = Array.isArray(raw.zones)
      ? raw.zones.map((zone) => this.ensureProductZone(zone))
      : [];

    const compatibilityRules = Array.isArray(raw.compatibilityRules)
      ? raw.compatibilityRules
          .map((rule) => this.ensureCompatibilityRule(rule))
          .filter((rule): rule is CompatibilityRule => rule !== undefined)
      : undefined;

    return {
      zones,
      compatibilityRules,
      globalConstraints: this.ensureGlobalConstraints(raw.globalConstraints),
      pricing: this.ensurePricingRules(raw.pricing),
      metadata: this.ensureRecord(raw.metadata),
    };
  }

  private serializeRules(rules: ProductRules): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(rules)) as Prisma.InputJsonValue;
  }

  private ensureProductZone(zone: unknown): ProductZone {
    if (!zone || typeof zone !== 'object' || Array.isArray(zone)) {
      return {
        id: this.generateZoneId(),
        label: 'Zone',
        type: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
    }

    const raw = zone as Partial<ProductZone> & Record<string, unknown>;

    return {
      id: typeof raw.id === 'string' ? raw.id : this.generateZoneId(),
      label: typeof raw.label === 'string' ? raw.label : 'Zone',
      type: this.ensureZoneType(raw.type),
      x: typeof raw.x === 'number' ? raw.x : 0,
      y: typeof raw.y === 'number' ? raw.y : 0,
      width: typeof raw.width === 'number' ? raw.width : 100,
      height: typeof raw.height === 'number' ? raw.height : 100,
      allowedMime: Array.isArray(raw.allowedMime)
        ? raw.allowedMime.filter((mime): mime is string => typeof mime === 'string')
        : undefined,
      maxResolution: this.ensureResolution(raw.maxResolution),
      priceDeltaCents: typeof raw.priceDeltaCents === 'number' ? raw.priceDeltaCents : undefined,
      constraints:
        raw.constraints && typeof raw.constraints === 'object' && !Array.isArray(raw.constraints)
          ? (raw.constraints as ProductZone['constraints'])
          : undefined,
      metadata: this.ensureRecord(raw.metadata),
    };
  }

  private ensureZoneType(type: unknown): ProductZone['type'] {
    if (type === 'text' || type === 'color' || type === 'select') {
      return type;
    }
    return 'image';
  }

  private ensureRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }

  private ensureResolution(value: unknown): { w: number; h: number } | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const width = record.w;
    const height = record.h;

    if (typeof width === 'number' && Number.isFinite(width) && typeof height === 'number' && Number.isFinite(height)) {
      return { w: width, h: height };
    }

    return undefined;
  }

  private ensureCompatibilityRule(rule: unknown): CompatibilityRule | undefined {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      return undefined;
    }

    const raw = rule as Partial<CompatibilityRule> & Record<string, unknown>;
    if (!raw.if || typeof raw.if !== 'object' || Array.isArray(raw.if)) {
      return undefined;
    }

    return {
      if: raw.if as CompatibilityCondition,
      deny: Array.isArray(raw.deny) ? raw.deny.filter((item): item is string => typeof item === 'string') : undefined,
      allow: Array.isArray(raw.allow) ? raw.allow.filter((item): item is string => typeof item === 'string') : undefined,
      require: Array.isArray(raw.require)
        ? raw.require.filter((item): item is string => typeof item === 'string')
        : undefined,
      priceMultiplier: typeof raw.priceMultiplier === 'number' ? raw.priceMultiplier : undefined,
    };
  }

  private ensureGlobalConstraints(value: unknown): ProductRules['globalConstraints'] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as ProductRules['globalConstraints'];
  }

  private ensurePricingRules(value: unknown): PricingRules | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as PricingRules;
  }

  private ensureImageZoneOptions(option: DesignZoneOption | undefined): DesignImageZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignImageZoneOptions;
  }

  private ensureTextZoneOptions(option: DesignZoneOption | undefined): DesignTextZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignTextZoneOptions;
  }

  private ensureColorZoneOptions(option: DesignZoneOption | undefined): DesignColorZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignColorZoneOptions;
  }

  private ensureSelectZoneOptions(option: DesignZoneOption | undefined): DesignSelectZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignSelectZoneOptions;
  }

  private extractDimensions(option: DesignZoneOption): { width?: number; height?: number } {
    const imageOptions = this.ensureImageZoneOptions(option);
    const width = typeof imageOptions.width === 'number' ? imageOptions.width : undefined;
    const height = typeof imageOptions.height === 'number' ? imageOptions.height : undefined;
    return { width, height };
  }

  private generateZoneId(): string {
    return `zone_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
