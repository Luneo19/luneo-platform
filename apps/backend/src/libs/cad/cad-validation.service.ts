import { Injectable, Logger } from '@nestjs/common';
import {
  CADValidationRequest,
  CADValidationResult,
  GeometricConstraints,
  SettingConstraints,
  CollisionConstraints,
} from './cad-constraints.interface';

/**
 * Service de validation CAD paramétrique
 * 
 * Valide les contraintes géométriques, tolérances, et collisions
 * pour s'assurer qu'un design est manufacturable.
 */
@Injectable()
export class CADValidationService {
  private readonly logger = new Logger(CADValidationService.name);

  // Constantes de validation (valeurs typiques pour bijoux)
  private readonly CONSTANTS = {
    MIN_RING_THICKNESS: 0.8, // mm (minimum pour solidité)
    MAX_RING_THICKNESS: 5.0, // mm (maximum raisonnable)
    MIN_CLAW_THICKNESS: 0.3, // mm (minimum pour tenir pierre)
    MIN_PAVE_SPACING: 0.1, // mm (minimum entre pierres)
    MIN_CURVATURE_RADIUS: 0.5, // mm (minimum pour éviter cassure)
    METAL_DENSITY: {
      gold: 19.32, // g/cm³
      silver: 10.49,
      platinum: 21.45,
      'rose-gold': 19.32,
      'white-gold': 19.32,
    },
  };

  /**
   * Valide un design CAD
   */
  async validate(request: CADValidationRequest): Promise<CADValidationResult> {
    const errors: CADValidationResult['errors'] = [];
    const warnings: CADValidationResult['warnings'] = [];

    try {
      // 1. Validation géométrique
      const geometricValidation = this.validateGeometric(
        request.parameters,
        request.constraints.geometric,
      );
      errors.push(...geometricValidation.errors);
      warnings.push(...geometricValidation.warnings);

      // 2. Validation setting (sertissage)
      if (request.parameters.setting) {
        const settingValidation = this.validateSetting(
          request.parameters,
          request.constraints.setting,
        );
        errors.push(...settingValidation.errors);
        warnings.push(...settingValidation.warnings);
      }

      // 3. Validation collisions
      if (request.parameters.stones && request.parameters.stones.length > 0) {
        const collisionValidation = this.validateCollisions(
          request.parameters,
          request.constraints.collision,
        );
        errors.push(...collisionValidation.errors);
        warnings.push(...collisionValidation.warnings);
      }

      // 4. Estimation poids et coût
      const estimatedWeight = this.estimateWeight(request.parameters);
      const estimatedCost = this.estimateCost(request.parameters, estimatedWeight);

      // 5. Faisabilité manufacturing
      const feasibility = this.assessManufacturingFeasibility(
        request.parameters,
        errors,
        warnings,
      );

      return {
        isValid: errors.filter((e) => e.severity === 'error').length === 0,
        errors,
        warnings,
        estimatedWeight,
        estimatedCost,
        manufacturingFeasibility: feasibility,
      };
    } catch (error) {
      this.logger.error(`CAD validation failed for design ${request.designId}:`, error);
      throw error;
    }
  }

  /**
   * Valide les contraintes géométriques
   */
  private validateGeometric(
    parameters: CADValidationRequest['parameters'],
    constraints?: GeometricConstraints,
  ): { errors: CADValidationResult['errors']; warnings: CADValidationResult['warnings'] } {
    const errors: CADValidationResult['errors'] = [];
    const warnings: CADValidationResult['warnings'] = [];

    // Validation épaisseur
    if (parameters.thickness !== undefined) {
      const minThickness = constraints?.minThickness || this.CONSTANTS.MIN_RING_THICKNESS;
      const maxThickness = constraints?.maxThickness || this.CONSTANTS.MAX_RING_THICKNESS;

      if (parameters.thickness < minThickness) {
        errors.push({
          type: 'thickness',
          message: `Thickness ${parameters.thickness}mm is below minimum ${minThickness}mm`,
          severity: 'error',
          parameter: 'thickness',
          value: parameters.thickness,
          constraint: minThickness,
        });
      } else if (parameters.thickness > maxThickness) {
        warnings.push({
          type: 'thickness',
          message: `Thickness ${parameters.thickness}mm exceeds recommended ${maxThickness}mm`,
          recommendation: 'Consider reducing thickness for better comfort',
        });
      }
    }

    // Validation taille bague
    if (parameters.ringSize !== undefined) {
      const minSize = constraints?.minRingSize || 3;
      const maxSize = constraints?.maxRingSize || 15;

      if (parameters.ringSize < minSize || parameters.ringSize > maxSize) {
        errors.push({
          type: 'tolerance',
          message: `Ring size ${parameters.ringSize} is outside valid range [${minSize}, ${maxSize}]`,
          severity: 'error',
          parameter: 'ringSize',
          value: parameters.ringSize,
        });
      }
    }

    // Validation poids
    const estimatedWeight = this.estimateWeight(parameters);
    if (constraints?.maxWeight && estimatedWeight > constraints.maxWeight) {
      errors.push({
        type: 'weight',
        message: `Estimated weight ${estimatedWeight.toFixed(2)}g exceeds maximum ${constraints.maxWeight}g`,
        severity: 'error',
        parameter: 'weight',
        value: estimatedWeight,
        constraint: constraints.maxWeight,
      });
    }

    return { errors, warnings };
  }

  /**
   * Valide les contraintes de sertissage
   */
  private validateSetting(
    parameters: CADValidationRequest['parameters'],
    constraints?: SettingConstraints,
  ): { errors: CADValidationResult['errors']; warnings: CADValidationResult['warnings'] } {
    const errors: CADValidationResult['errors'] = [];
    const warnings: CADValidationResult['warnings'] = [];

    if (!parameters.setting) {
      return { errors, warnings };
    }

    const setting = parameters.setting;

    // Validation griffes
    if (setting.type === 'claw') {
      const minClawThickness =
        constraints?.minClawThickness || this.CONSTANTS.MIN_CLAW_THICKNESS;
      const clawThickness = setting.parameters?.clawThickness || 0;

      if (clawThickness < minClawThickness) {
        errors.push({
          type: 'setting',
          message: `Claw thickness ${clawThickness}mm is below minimum ${minClawThickness}mm`,
          severity: 'error',
          parameter: 'clawThickness',
          value: clawThickness,
          constraint: minClawThickness,
        });
      }
    }

    // Validation pavé
    if (setting.type === 'pave' && parameters.stones && parameters.stones.length > 1) {
      const minSpacing = constraints?.minPaveSpacing || this.CONSTANTS.MIN_PAVE_SPACING;

      // Vérifier espacement entre pierres
      for (let i = 0; i < parameters.stones.length; i++) {
        for (let j = i + 1; j < parameters.stones.length; j++) {
          const stone1 = parameters.stones[i];
          const stone2 = parameters.stones[j];
          const distance = this.calculateDistance(stone1.position, stone2.position);
          const minDistance = (stone1.size + stone2.size) / 2 + minSpacing;

          if (distance < minDistance) {
            errors.push({
              type: 'setting',
              message: `Stones too close: ${distance.toFixed(2)}mm < ${minDistance.toFixed(2)}mm minimum`,
              severity: 'error',
              parameter: 'paveSpacing',
              value: distance,
              constraint: minDistance,
            });
          }
        }
      }
    }

    // Validation taille pierres
    if (parameters.stones) {
      for (const stone of parameters.stones) {
        if (constraints?.minStoneSize && stone.size < constraints.minStoneSize) {
          warnings.push({
            type: 'setting',
            message: `Stone size ${stone.size}mm is below recommended ${constraints.minStoneSize}mm`,
            recommendation: 'Consider larger stones for better visibility',
          });
        }

        if (constraints?.maxStoneSize && stone.size > constraints.maxStoneSize) {
          errors.push({
            type: 'setting',
            message: `Stone size ${stone.size}mm exceeds maximum ${constraints.maxStoneSize}mm`,
            severity: 'error',
            parameter: 'stoneSize',
            value: stone.size,
            constraint: constraints.maxStoneSize,
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Valide les collisions
   */
  private validateCollisions(
    parameters: CADValidationRequest['parameters'],
    constraints?: CollisionConstraints,
  ): { errors: CADValidationResult['errors']; warnings: CADValidationResult['warnings'] } {
    const errors: CADValidationResult['errors'] = [];
    const warnings: CADValidationResult['warnings'] = [];

    if (!parameters.stones || parameters.stones.length === 0) {
      return { errors, warnings };
    }

    const minClearance = constraints?.minClearance || 0.1; // mm

    // Vérifier collisions pierre-pierre
    if (constraints?.checkStoneStoneCollision !== false) {
      for (let i = 0; i < parameters.stones.length; i++) {
        for (let j = i + 1; j < parameters.stones.length; j++) {
          const stone1 = parameters.stones[i];
          const stone2 = parameters.stones[j];
          const distance = this.calculateDistance(stone1.position, stone2.position);
          const minDistance = (stone1.size + stone2.size) / 2 + minClearance;

          if (distance < minDistance) {
            errors.push({
              type: 'collision',
              message: `Stone collision detected: stones ${i} and ${j} are too close`,
              severity: 'error',
              parameter: 'stoneCollision',
              value: distance,
              constraint: minDistance,
            });
          }
        }
      }
    }

    // Vérifier collisions pierre-griffe (si setting claw)
    if (
      constraints?.checkStoneClawCollision !== false &&
      parameters.setting?.type === 'claw'
    ) {
      // TODO: Implémenter validation collision pierre-griffe
      // Nécessite géométrie 3D plus complexe
    }

    return { errors, warnings };
  }

  /**
   * Estime le poids du bijou
   */
  private estimateWeight(parameters: CADValidationRequest['parameters']): number {
    // Estimation basique basée sur volume et densité métal
    const metal = parameters.metal || 'gold';
    const density = this.CONSTANTS.METAL_DENSITY[metal] || 19.32; // g/cm³

    // Volume estimé (simplifié)
    // Pour un anneau: volume = π * (R² - r²) * h
    // R = rayon extérieur, r = rayon intérieur, h = hauteur
    const ringSize = parameters.ringSize || 7; // US size
    const innerRadius = (ringSize / 2) * 2.54 / 10; // mm to cm
    const thickness = parameters.thickness || 1.5; // mm
    const outerRadius = innerRadius + thickness / 10; // cm
    const height = 5; // cm (hauteur moyenne anneau)

    const volume = Math.PI * (outerRadius ** 2 - innerRadius ** 2) * height; // cm³
    const weight = volume * density; // g

    return weight;
  }

  /**
   * Estime le coût de manufacturing
   */
  private estimateCost(
    parameters: CADValidationRequest['parameters'],
    weight: number,
  ): number {
    // Coût basé sur:
    // - Métal (prix au gramme)
    // - Complexité (setting, nombre pierres)
    // - Main d'œuvre

    const metalPrices: Record<string, number> = {
      gold: 60, // €/g
      silver: 0.8,
      platinum: 30,
      'rose-gold': 60,
      'white-gold': 60,
    };

    const metal = parameters.metal || 'gold';
    const metalPrice = metalPrices[metal] || 60;
    const materialCost = weight * metalPrice * 100; // cents

    // Coût main d'œuvre (basé sur complexité)
    let laborCost = 5000; // 50€ base
    if (parameters.setting) {
      laborCost += 2000; // +20€ pour sertissage
    }
    if (parameters.stones && parameters.stones.length > 0) {
      laborCost += parameters.stones.length * 1000; // +10€ par pierre
    }

    return materialCost + laborCost;
  }

  /**
   * Évalue la faisabilité manufacturing
   */
  private assessManufacturingFeasibility(
    parameters: CADValidationRequest['parameters'],
    errors: CADValidationResult['errors'],
    warnings: CADValidationResult['warnings'],
  ): CADValidationResult['manufacturingFeasibility'] {
    const errorCount = errors.filter((e) => e.severity === 'error').length;
    const warningCount = warnings.length;

    if (errorCount > 0) {
      return {
        feasible: false,
        complexity: 'very-complex',
      };
    }

    // Déterminer complexité
    let complexity: 'simple' | 'medium' | 'complex' | 'very-complex' = 'simple';

    if (parameters.stones && parameters.stones.length > 5) {
      complexity = 'complex';
    } else if (parameters.stones && parameters.stones.length > 0) {
      complexity = 'medium';
    }

    if (parameters.setting?.type === 'pave') {
      complexity = complexity === 'simple' ? 'medium' : 'complex';
    }

    if (warningCount > 3) {
      complexity = complexity === 'complex' ? 'very-complex' : 'complex';
    }

    // Estimer temps production
    const estimatedTime = this.estimateProductionTime(parameters, complexity);

    return {
      feasible: true,
      complexity,
      estimatedTime,
    };
  }

  /**
   * Estime le temps de production
   */
  private estimateProductionTime(
    parameters: CADValidationRequest['parameters'],
    complexity: string,
  ): number {
    const baseTime = 2; // heures de base

    const complexityMultiplier: Record<string, number> = {
      simple: 1,
      medium: 1.5,
      complex: 2.5,
      'very-complex': 4,
    };

    let time = baseTime * (complexityMultiplier[complexity] || 1);

    // Ajouter temps pour pierres
    if (parameters.stones) {
      time += parameters.stones.length * 0.5; // 30 min par pierre
    }

    return Math.round(time * 10) / 10; // Arrondir à 0.1h
  }

  /**
   * Calcule la distance entre deux points 3D
   */
  private calculateDistance(
    pos1: { x: number; y: number; z: number },
    pos2: { x: number; y: number; z: number },
  ): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
































