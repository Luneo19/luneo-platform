/**
 * AR Studio - Scale Checker Service
 * Verifies and corrects 3D model scale for AR (real-world dimensions)
 */

import { Injectable, Logger } from '@nestjs/common';

export interface ScaleCheckResult {
  isCorrect: boolean;
  detectedUnit: 'mm' | 'cm' | 'm' | 'inches' | 'unknown';
  suggestedScale: number;
  currentDimensions: { width: number; height: number; depth: number };
  correctedDimensions: { width: number; height: number; depth: number };
  issues: string[];
}

// Common product dimension ranges (in meters)
const DIMENSION_RANGES: Record<string, { min: number; max: number }> = {
  ring: { min: 0.015, max: 0.03 },
  watch: { min: 0.03, max: 0.06 },
  necklace: { min: 0.3, max: 0.6 },
  bracelet: { min: 0.05, max: 0.1 },
  earring: { min: 0.01, max: 0.05 },
  glasses: { min: 0.12, max: 0.18 },
  shoe: { min: 0.2, max: 0.35 },
  chair: { min: 0.4, max: 1.2 },
  table: { min: 0.5, max: 2.0 },
  lamp: { min: 0.2, max: 1.5 },
  vase: { min: 0.1, max: 0.5 },
  general: { min: 0.01, max: 10.0 },
};

@Injectable()
export class ScaleCheckerService {
  private readonly logger = new Logger(ScaleCheckerService.name);

  /**
   * Check if a model's scale is appropriate for AR
   */
  checkScale(
    boundingBox: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
    productType?: string,
  ): ScaleCheckResult {
    const width = Math.abs(boundingBox.max.x - boundingBox.min.x);
    const height = Math.abs(boundingBox.max.y - boundingBox.min.y);
    const depth = Math.abs(boundingBox.max.z - boundingBox.min.z);
    const maxDim = Math.max(width, height, depth);

    const issues: string[] = [];
    let detectedUnit: ScaleCheckResult['detectedUnit'] = 'unknown';
    let suggestedScale = 1.0;

    // Detect likely unit based on dimensions
    if (maxDim > 100) {
      detectedUnit = 'mm';
      suggestedScale = 0.001; // mm to m
      issues.push('Model appears to be in millimeters - will scale to meters');
    } else if (maxDim > 10) {
      detectedUnit = 'cm';
      suggestedScale = 0.01; // cm to m
      issues.push('Model appears to be in centimeters - will scale to meters');
    } else if (maxDim > 0.001 && maxDim < 100) {
      detectedUnit = 'm';
      suggestedScale = 1.0;
    } else if (maxDim > 0.3 && maxDim < 40) {
      detectedUnit = 'inches';
      suggestedScale = 0.0254; // inches to m
    }

    // Check against product type ranges
    const range = DIMENSION_RANGES[productType || 'general'] || DIMENSION_RANGES.general;
    const scaledMaxDim = maxDim * suggestedScale;

    if (scaledMaxDim < range.min) {
      issues.push(`Model seems too small for ${productType || 'general'} category (${(scaledMaxDim * 100).toFixed(1)} cm)`);
    } else if (scaledMaxDim > range.max) {
      issues.push(`Model seems too large for ${productType || 'general'} category (${(scaledMaxDim * 100).toFixed(1)} cm)`);
    }

    const correctedDimensions = {
      width: width * suggestedScale,
      height: height * suggestedScale,
      depth: depth * suggestedScale,
    };

    return {
      isCorrect: suggestedScale === 1.0 && issues.length === 0,
      detectedUnit,
      suggestedScale,
      currentDimensions: { width, height, depth },
      correctedDimensions,
      issues,
    };
  }
}
