import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  DesignOptions,
  ProductZone,
  ZoneValidationContext
} from '../interfaces/product-rules.interface';

@Injectable()
export class ValidationEngine {
  private readonly logger = new Logger(ValidationEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Valide un design complet avec toutes les règles
   */
  async validateDesign(
    context: ZoneValidationContext
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validation des zones
      const zoneValidation = await this.validateZones(context);
      errors.push(...zoneValidation.errors);
      warnings.push(...zoneValidation.warnings);

      // Validation des contraintes de compatibilité
      const compatibilityValidation = this.validateCompatibility(context);
      errors.push(...compatibilityValidation.errors);
      warnings.push(...compatibilityValidation.warnings);

      // Validation des contraintes globales
      const globalValidation = this.validateGlobalConstraints(context);
      errors.push(...globalValidation.errors);
      warnings.push(...globalValidation.warnings);

      // Validation de la cohérence business
      const businessValidation = await this.validateBusinessRules(context);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);

      // Validation de la qualité des assets
      const qualityValidation = await this.validateAssetQuality(context);
      errors.push(...qualityValidation.errors);
      warnings.push(...qualityValidation.warnings);

      // Calcul du temps de production estimé
      const estimatedProductionTime = await this.calculateProductionTime(context);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        price: 0, // Sera calculé par le PricingEngine
        estimatedProductionTime,
      };
    } catch (error) {
      this.logger.error('Error validating design:', error);
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: 'Erreur lors de la validation du design',
          severity: 'error'
        }],
        warnings: [],
        price: 0,
      };
    }
  }

  /**
   * Valide les zones individuelles
   */
  private async validateZones(context: ZoneValidationContext): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

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
        const opts = zoneOptions as Record<string, unknown>;
        // Validation spécifique au type de zone
        switch (zone.type) {
          case 'image':
            this.validateImageZone(zone, opts, errors, warnings);
            break;
          case 'text':
            this.validateTextZone(zone, opts, errors, warnings);
            break;
          case 'color':
            this.validateColorZone(zone, opts, errors, warnings);
            break;
          case 'select':
            this.validateSelectZone(zone, opts, errors, warnings);
            break;
        }

        // Validation des contraintes communes
        this.validateZoneConstraints(zone, opts, errors, warnings);
      }
    }

    return { errors, warnings };
  }

  /**
   * Valide une zone image
   */
  private validateImageZone(
    zone: ProductZone,
    options: Record<string, unknown>,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Vérifier la présence de l'image
    if (!options.imageUrl && !options.imageFile) {
      errors.push({
        code: 'IMAGE_REQUIRED',
        message: `Une image est requise pour la zone "${zone.label}"`,
        zone: zone.id,
        severity: 'error'
      });
      return;
    }

    // Vérifier le format
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
    if (zone.maxResolution && options.width && options.height) {
      if ((Number(options.width) > zone.maxResolution.w) || (Number(options.height) > zone.maxResolution.h)) {
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

    // Vérifier la qualité de l'image
    if (options.quality != null && Number(options.quality) < 0.8) {
      warnings.push({
        code: 'LOW_IMAGE_QUALITY',
        message: `La qualité de l'image est faible`,
        suggestion: 'Utilisez une image de meilleure qualité pour un résultat optimal'
      });
    }
  }

  /**
   * Valide une zone texte
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

    // Vérifier la longueur
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
      const regex = new RegExp(zone.constraints.pattern as unknown as string);
      if (!regex.test(options.text)) {
        errors.push({
          code: 'TEXT_PATTERN_MISMATCH',
          message: `Le texte ne respecte pas le format requis`,
          zone: zone.id,
          severity: 'error'
        });
      }
    }

    // Vérifier les polices
    if (zone.constraints?.allowedFonts && options.font) {
      if (!zone.constraints.allowedFonts.includes(options.font as string)) {
        warnings.push({
          code: 'FONT_NOT_RECOMMENDED',
          message: `La police "${options.font}" n'est pas recommandée`,
          suggestion: `Utilisez une de ces polices: ${zone.constraints.allowedFonts.join(', ')}`
        });
      }
    }

    // Vérifier les caractères spéciaux
    if (this.containsSpecialCharacters(options.text)) {
      warnings.push({
        code: 'SPECIAL_CHARACTERS_DETECTED',
        message: 'Des caractères spéciaux ont été détectés',
        suggestion: 'Vérifiez que tous les caractères sont bien supportés'
      });
    }
  }

  /**
   * Valide une zone couleur
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

    // Vérifier la cohérence des couleurs
    if (options.color && !this.isValidColorFormat(options.color as string)) {
      errors.push({
        code: 'INVALID_COLOR_FORMAT',
        message: `Format de couleur invalide`,
        zone: zone.id,
        severity: 'error'
      });
    }
  }

  /**
   * Valide une zone de sélection
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

    // Vérifier les options autorisées
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
  private validateCompatibility(context: ZoneValidationContext): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!context.rules.compatibilityRules) {
      return { errors, warnings };
    }

    for (const rule of context.rules.compatibilityRules) {
      if (this.evaluateRuleCondition(rule.if, context.options)) {
        // Vérifier les interdictions
        if (rule.deny) {
          for (const denied of rule.deny) {
            if (this.hasOption(context.options, denied)) {
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
            if (!this.hasOption(context.options, required)) {
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
  private validateGlobalConstraints(context: ZoneValidationContext): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!context.rules.globalConstraints) {
      return { errors, warnings };
    }

    const constraints = context.rules.globalConstraints;

    // Vérifier la quantité
    if (constraints.minOrderQuantity && context.options.quantity != null) {
      if (Number(context.options.quantity) < constraints.minOrderQuantity) {
        errors.push({
          code: 'MIN_QUANTITY_NOT_MET',
          message: `Quantité minimale: ${constraints.minOrderQuantity}`,
          severity: 'error'
        });
      }
    }

    if (constraints.maxOrderQuantity && context.options.quantity != null) {
      if (Number(context.options.quantity) > constraints.maxOrderQuantity) {
        errors.push({
          code: 'MAX_QUANTITY_EXCEEDED',
          message: `Quantité maximale: ${constraints.maxOrderQuantity}`,
          severity: 'error'
        });
      }
    }

    // Vérifier les matériaux
    if (constraints.allowedMaterials && context.options.materials) {
      for (const material of Object.keys(context.options.materials)) {
        if (!constraints.allowedMaterials.includes(material)) {
          errors.push({
            code: 'MATERIAL_NOT_ALLOWED',
            message: `Le matériau "${material}" n'est pas autorisé`,
            severity: 'error'
          });
        }
      }
    }

    // Vérifier les finitions
    if (constraints.allowedFinishes && context.options.finishes) {
      for (const finish of Object.keys(context.options.finishes)) {
        if (!constraints.allowedFinishes.includes(finish)) {
          errors.push({
            code: 'FINISH_NOT_ALLOWED',
            message: `La finition "${finish}" n'est pas autorisée`,
            severity: 'error'
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Valide les règles business
   */
  private async validateBusinessRules(context: ZoneValidationContext): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Vérifier les limites de la marque
      const brand = await this.prisma.brand.findUnique({
        where: { id: context.brandId },
        select: {
          id: true,
          plan: true,
          limits: true,
        },
      });

      if (brand) {
        // Vérifier les limites du plan
        if (brand.limits) {
          const limits = brand.limits as Record<string, unknown>;
          
          // Limite de zones
          if (limits.maxZonesPerDesign != null && context.rules.zones.length > Number(limits.maxZonesPerDesign)) {
            errors.push({
              code: 'ZONES_LIMIT_EXCEEDED',
              message: `Limite de zones dépassée (${limits.maxZonesPerDesign})`,
              severity: 'error'
            });
          }

          // Limite de complexité
          if (limits.maxComplexity != null && this.calculateComplexity(context.options) > Number(limits.maxComplexity)) {
            warnings.push({
              code: 'COMPLEXITY_WARNING',
              message: 'Le design est très complexe',
              suggestion: 'Simplifiez le design pour améliorer les performances'
            });
          }
        }
      }

      // Vérifier l'historique des commandes pour détecter les patterns
      const recentOrders = await this.prisma.order.findMany({
        where: {
          brandId: context.brandId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
          },
        },
        select: { id: true },
      });

      if (recentOrders.length > 100) {
        warnings.push({
          code: 'HIGH_VOLUME_WARNING',
          message: 'Volume élevé de commandes détecté',
          suggestion: 'Vérifiez la capacité de production'
        });
      }

    } catch (error) {
      this.logger.error('Error validating business rules:', error);
    }

    return { errors, warnings };
  }

  /**
   * Valide la qualité des assets
   */
  private async validateAssetQuality(context: ZoneValidationContext): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      for (const [zoneId, zoneOptions] of Object.entries(context.options.zones)) {
        const zone = context.rules.zones.find(z => z.id === zoneId);
        if (!zone || zone.type !== 'image') continue;

        const opts = zoneOptions as Record<string, unknown>;
        // Vérifier la qualité de l'image
        if (opts.imageUrl) {
          const qualityCheck = await this.checkImageQuality(opts.imageUrl as string);
          
          if (qualityCheck.isLowQuality) {
            warnings.push({
              code: 'LOW_IMAGE_QUALITY',
              message: `Image de faible qualité dans la zone "${zone.label}"`,
              suggestion: 'Utilisez une image de meilleure résolution'
            });
          }

          if (qualityCheck.hasArtifacts) {
            warnings.push({
              code: 'IMAGE_ARTIFACTS',
              message: `Artéfacts détectés dans l'image de la zone "${zone.label}"`,
              suggestion: 'Utilisez une image plus nette'
            });
          }
        }
      }
    } catch (error: unknown) {
      this.logger.error('Error validating asset quality:', error);
    }

    return { errors, warnings };
  }

  /**
   * Calcule le temps de production estimé
   */
  private async calculateProductionTime(context: ZoneValidationContext): Promise<number> {
    let baseTime = 2; // 2 heures de base

    // Ajouter du temps selon la complexité
    const complexity = this.calculateComplexity(context.options);
    baseTime += complexity * 0.5;

    // Ajouter du temps selon le nombre de zones
    baseTime += context.rules.zones.length * 0.3;

    // Ajouter du temps selon les matériaux
    if (context.options.materials) {
      for (const material of Object.keys(context.options.materials)) {
        if (this.isComplexMaterial(material)) {
          baseTime += 1;
        }
      }
    }

    // Ajouter du temps selon les finitions
    if (context.options.finishes) {
      for (const finish of Object.keys(context.options.finishes)) {
        if (this.isComplexFinish(finish)) {
          baseTime += 0.5;
        }
      }
    }

    return Math.ceil(baseTime);
  }

  /**
   * Calcule la complexité d'un design
   */
  private calculateComplexity(options: DesignOptions): number {
    let complexity = 0;

    // Complexité basée sur les zones
    if (options.zones) {
      for (const zoneOptions of Object.values(options.zones)) {
        const opts = zoneOptions as Record<string, unknown>;
        if (opts.complexity === 'complex') {
          complexity += 3;
        } else if (opts.complexity === 'medium') {
          complexity += 2;
        } else {
          complexity += 1;
        }
      }
    }

    // Complexité basée sur les effets
    if (options.customizations?.effects) {
      const effects = options.customizations.effects as unknown[];
      complexity += effects.length;
    }

    return complexity;
  }

  /**
   * Vérifie la qualité d'une image
   */
  private async checkImageQuality(_imageUrl: string): Promise<{
    isLowQuality: boolean;
    hasArtifacts: boolean;
    resolution: { width: number; height: number };
  }> {
    // Simulation de vérification de qualité
    // En production, utiliser une API d'analyse d'image
    return {
      isLowQuality: false,
      hasArtifacts: false,
      resolution: { width: 1920, height: 1080 },
    };
  }

  /**
   * Vérifie si un matériau est complexe
   */
  private isComplexMaterial(material: string): boolean {
    const complexMaterials = ['gold', 'silver', 'platinum', 'titanium'];
    return complexMaterials.includes(material.toLowerCase());
  }

  /**
   * Vérifie si une finition est complexe
   */
  private isComplexFinish(finish: string): boolean {
    const complexFinishes = ['engraved', 'embossed', 'patina', 'antique'];
    return complexFinishes.includes(finish.toLowerCase());
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
   * Vérifie si un texte contient des caractères spéciaux
   */
  private containsSpecialCharacters(text: string): boolean {
    const specialChars = /[^\w\s\-.,!?()]/;
    return specialChars.test(text);
  }

  /**
   * Vérifie si un format de couleur est valide
   */
  private isValidColorFormat(color: string): boolean {
    // Vérifier les formats hex, rgb, hsl, etc.
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const namedColors = ['red', 'blue', 'green', 'black', 'white', 'gold', 'silver'];
    
    return hexRegex.test(color) || rgbRegex.test(color) || namedColors.includes(color.toLowerCase());
  }
}


