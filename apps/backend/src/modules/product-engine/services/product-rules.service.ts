import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
  DesignOptions,
  GlobalConstraints
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
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as unknown as ProductRules | null;
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

      const rules = product.rulesJson as unknown as Record<string, unknown>;
      
      // Mettre en cache pour 1 heure
      await this.cache.setSimple(cacheKey, JSON.stringify(rules), 3600);
      
      return rules as unknown as ProductRules;
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
        data: { rulesJson: rules as unknown as import('@prisma/client').Prisma.InputJsonValue },
        select: { id: true, rulesJson: true },
      });

      // Invalider le cache
      await this.cache.delSimple(`product_rules:${productId}`);
      
      // Mettre en cache les nouvelles règles
      await this.cache.setSimple(`product_rules:${productId}`, JSON.stringify(rules), 3600);

      return updatedProduct.rulesJson as unknown as ProductRules;
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
      // Valider chaque zone
      for (const zone of context.rules.zones) {
        const zoneOptions = context.options.zones[zone.id];
        
        if (!zoneOptions && zone.constraints?.required) {
          errors.push({
            code: 'ZONE_REQUIRED',
            message: `La zone "${zone.label}" est obligatoire`,
            zone: zone.id,
            severity: 'error'
          });
          continue;
        }

        if (zoneOptions) {
          const zoneValidation = this.validateZone(zone, zoneOptions as Record<string, unknown>);
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
  private validateZone(zone: ProductZone, options: Record<string, unknown>): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validation du type
    switch (zone.type) {
      case 'text':
        this.validateTextZone(zone, options, errors, warnings);
        break;
      case 'image':
        this.validateImageZone(zone, options, errors, warnings);
        break;
      case 'color':
        this.validateColorZone(zone, options, errors, warnings);
        break;
      case 'select':
        this.validateSelectZone(zone, options, errors, warnings);
        break;
    }

    // Validation des contraintes
    if (zone.constraints) {
      this.validateZoneConstraints(zone, options, errors, warnings);
    }

    return { errors, warnings };
  }

  /**
   * Valide une zone de type texte
   */
  private validateTextZone(
    zone: ProductZone,
    options: Record<string, unknown>,
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
      if (!zone.constraints.allowedFonts.includes(options.font as string)) {
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
    options: Record<string, unknown>,
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
      if (!zone.allowedMime.includes(options.mimeType as string)) {
        errors.push({
          code: 'INVALID_IMAGE_FORMAT',
          message: `Format d'image non autorisé. Formats acceptés: ${zone.allowedMime.join(', ')}`,
          zone: zone.id,
          severity: 'error'
        });
      }
    }

    // Vérifier la résolution
    if (zone.maxResolution && options.width != null && options.height != null) {
      if (Number(options.width) > zone.maxResolution.w || Number(options.height) > zone.maxResolution.h) {
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
    options: Record<string, unknown>,
    errors: ValidationError[],
    _warnings: ValidationWarning[]
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
      if (!zone.constraints.allowedColors.includes(options.color as string)) {
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
    options: Record<string, unknown>,
    errors: ValidationError[],
    _warnings: ValidationWarning[]
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

    // Vérifier que la valeur est dans les options autorisées
    const allowedOptions = (Array.isArray(zone.metadata?.options) ? zone.metadata.options : []) as string[];
    if (allowedOptions.length > 0 && !allowedOptions.includes(options.value as string)) {
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
    options: Record<string, unknown>,
    errors: ValidationError[],
    _warnings: ValidationWarning[]
  ): void {
    if (!zone.constraints) return;

    // Vérifier la taille minimale
    if (zone.constraints.minSize && options.width != null && options.height != null) {
      if (Number(options.width) < zone.constraints.minSize.w || Number(options.height) < zone.constraints.minSize.h) {
        errors.push({
          code: 'SIZE_TOO_SMALL',
          message: `La taille est trop petite. Minimum: ${zone.constraints.minSize.w}x${zone.constraints.minSize.h}px`,
          zone: zone.id,
          severity: 'error'
        });
      }
    }

    // Vérifier la taille maximale
    if (zone.constraints.maxSize && options.width != null && options.height != null) {
      if (Number(options.width) > zone.constraints.maxSize.w || Number(options.height) > zone.constraints.maxSize.h) {
        errors.push({
          code: 'SIZE_TOO_LARGE',
          message: `La taille est trop grande. Maximum: ${zone.constraints.maxSize.w}x${zone.constraints.maxSize.h}px`,
          zone: zone.id,
          severity: 'error'
        });
      }
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
    constraints: GlobalConstraints | null | undefined,
    options: DesignOptions
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!constraints) return { errors, warnings };

    // Vérifier la quantité minimale
    if (constraints.minOrderQuantity && options.quantity) {
      if (options.quantity < constraints.minOrderQuantity) {
        errors.push({
          code: 'MIN_QUANTITY_NOT_MET',
          message: `Quantité minimale: ${constraints.minOrderQuantity}`,
          severity: 'error'
        });
      }
    }

    // Vérifier la quantité maximale
    if (constraints.maxOrderQuantity && options.quantity) {
      if (options.quantity > constraints.maxOrderQuantity) {
        errors.push({
          code: 'MAX_QUANTITY_EXCEEDED',
          message: `Quantité maximale: ${constraints.maxOrderQuantity}`,
          severity: 'error'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Évalue une condition de règle
   */
  private evaluateRuleCondition(condition: Record<string, unknown>, options: DesignOptions): boolean {
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
    const keys = optionPath.split('.');
    let current: unknown = options;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return false;
      }
    }
    
    return current !== undefined && current !== null;
  }

  /**
   * Vérifie si une option a une valeur spécifique
   */
  private hasOptionValue(options: DesignOptions, optionPath: string, expectedValue: unknown): boolean {
    const keys = optionPath.split('.');
    let current: unknown = options;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return false;
      }
    }
    
    return current === expectedValue;
  }

  /**
   * Valide la structure des règles
   */
  private validateRulesStructure(rules: ProductRules): void {
    if (!rules.zones || !Array.isArray(rules.zones)) {
      throw new BadRequestException('Les règles doivent contenir un tableau de zones');
    }

    for (const zone of rules.zones) {
      if (!zone.id || !zone.label || !zone.type) {
        throw new BadRequestException('Chaque zone doit avoir un id, label et type');
      }

      if (!['image', 'text', 'color', 'select'].includes(zone.type)) {
        throw new BadRequestException(`Type de zone invalide: ${zone.type}`);
      }

      if (typeof zone.x !== 'number' || typeof zone.y !== 'number' ||
          typeof zone.width !== 'number' || typeof zone.height !== 'number') {
        throw new BadRequestException('Les coordonnées et dimensions de zone doivent être des nombres');
      }
    }
  }

  /**
   * Obtient les statistiques d'usage des règles
   */
  async getRulesUsageStats(productId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<{ period: string; startDate: Date; endDate: Date; designs: Record<string, number>; orders: number }> {
    const cacheKey = `rules_usage:${productId}:${period}`;
    
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as { period: string; startDate: Date; endDate: Date; designs: Record<string, number>; orders: number };
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

      const stats = {
        period,
        startDate,
        endDate: now,
        designs: designsStats.reduce((acc, stat) => {
          acc[stat.status.toLowerCase()] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        orders: ordersStats,
      };

      // Mettre en cache pour 15 minutes
      await this.cache.setSimple(cacheKey, JSON.stringify(stats), 900);
      
      return stats;
    } catch (error) {
      this.logger.error(`Error fetching rules usage stats for ${productId}:`, error);
      throw error;
    }
  }
}


