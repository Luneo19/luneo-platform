/**
 * AR Studio - Orientation Fixer Service
 * Detects and corrects 3D model orientation for AR (Y-up convention)
 */

import { Injectable, Logger } from '@nestjs/common';

export interface OrientationCheckResult {
  isCorrect: boolean;
  detectedUpAxis: 'Y' | 'Z' | 'X' | 'unknown';
  correctionNeeded: {
    rotateX?: number; // degrees
    rotateY?: number;
    rotateZ?: number;
  };
  issues: string[];
}

@Injectable()
export class OrientationFixerService {
  private readonly logger = new Logger(OrientationFixerService.name);

  /**
   * Check model orientation based on format and bounding box
   */
  checkOrientation(
    format: string,
    boundingBox: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } },
  ): OrientationCheckResult {
    const issues: string[] = [];

    // Formats typically Z-up
    const zUpFormats = ['fbx', 'obj', '3ds', 'step', 'stp', 'stl'];
    // Formats typically Y-up
    const yUpFormats = ['gltf', 'glb', 'usdz'];

    const formatLower = format.toLowerCase();
    let detectedUpAxis: OrientationCheckResult['detectedUpAxis'] = 'unknown';
    const correctionNeeded: OrientationCheckResult['correctionNeeded'] = {};

    if (zUpFormats.includes(formatLower)) {
      detectedUpAxis = 'Z';
      correctionNeeded.rotateX = -90; // Rotate -90 around X to convert Z-up to Y-up
      issues.push(`Format ${format.toUpperCase()} uses Z-up convention - will rotate to Y-up for AR`);
    } else if (yUpFormats.includes(formatLower)) {
      detectedUpAxis = 'Y';
      // Already correct for AR
    }

    // Heuristic check: if height (Y) is very small compared to depth (Z),
    // the model might be laid flat (Z-up exported as Y-up without conversion)
    const height = Math.abs(boundingBox.max.y - boundingBox.min.y);
    const depth = Math.abs(boundingBox.max.z - boundingBox.min.z);

    if (yUpFormats.includes(formatLower) && depth > height * 5) {
      detectedUpAxis = 'Z';
      correctionNeeded.rotateX = -90;
      issues.push('Model appears to be Z-up despite Y-up format - auto-correction will apply');
    }

    return {
      isCorrect: detectedUpAxis === 'Y' || detectedUpAxis === 'unknown',
      detectedUpAxis,
      correctionNeeded,
      issues,
    };
  }
}
