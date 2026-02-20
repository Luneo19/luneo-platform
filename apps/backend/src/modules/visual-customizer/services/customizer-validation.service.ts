import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { VISUAL_CUSTOMIZER_LIMITS, CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES } from '../visual-customizer.constants';

interface CanvasData {
  version?: string;
  objects?: unknown[];
  background?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

@Injectable()
export class CustomizerValidationService {
  private readonly logger = new Logger(CustomizerValidationService.name);

  /**
   * Validate design structure and content
   */
  validateDesign(canvasData: CanvasData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check structure
    if (!canvasData || typeof canvasData !== 'object') {
      errors.push('Canvas data must be a valid object');
      return { isValid: false, errors, warnings };
    }

    // Check version
    if (!canvasData.version) {
      warnings.push('Canvas data version not specified');
    }

    // Check objects array
    if (!Array.isArray(canvasData.objects)) {
      errors.push('Canvas data must contain an objects array');
    } else {
      // Check object count
      if (canvasData.objects.length > VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY) {
        errors.push(
          `Design exceeds maximum complexity of ${VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY} objects`,
        );
      }

      // Validate each object
      canvasData.objects.forEach((value: unknown, index: number) => {
        const obj = value as Record<string, unknown>;
        if (!obj || typeof obj !== 'object') {
          errors.push(`Object at index ${index} is invalid`);
          return;
        }

        // Check object type
        if (obj.type && !CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES.includes(obj.type as (typeof CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES)[number])) {
          errors.push(
            `Object at index ${index} has invalid type: ${obj.type}`,
          );
        }

        // Check for required properties
        if (obj.type === 'image' && !obj.src) {
          errors.push(`Image object at index ${index} missing src`);
        }

        if (obj.type === 'text' && obj.text === undefined) {
          errors.push(`Text object at index ${index} missing text`);
        }
      });
    }

    // Check dimensions
    if (canvasData.width !== undefined) {
      if (
        canvasData.width < VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.width ||
        canvasData.width > VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.width
      ) {
        errors.push(
          `Canvas width ${canvasData.width} is out of allowed range`,
        );
      }
    }

    if (canvasData.height !== undefined) {
      if (
        canvasData.height < VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.height ||
        canvasData.height > VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.height
      ) {
        errors.push(
          `Canvas height ${canvasData.height} is out of allowed range`,
        );
      }
    }

    // Validate URLs in objects
    if (Array.isArray(canvasData.objects)) {
      canvasData.objects.forEach((value: unknown, index: number) => {
        const obj = value as Record<string, unknown>;
        if (obj.src && typeof obj.src === 'string') {
          const urlValidation = this.validateUrl(obj.src);
          if (!urlValidation.isValid) {
            errors.push(
              `Object at index ${index} has invalid URL: ${urlValidation.error}`,
            );
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate canvas data structure
   */
  validateCanvasData(data: CanvasData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check data size (rough estimate)
    const dataSize = JSON.stringify(data).length;
    if (dataSize > VISUAL_CUSTOMIZER_LIMITS.MAX_CANVAS_DATA_SIZE_BYTES) {
      errors.push(
        `Canvas data size ${dataSize} bytes exceeds maximum of ${VISUAL_CUSTOMIZER_LIMITS.MAX_CANVAS_DATA_SIZE_BYTES} bytes`,
      );
    }

    // Check version
    if (data.version && typeof data.version !== 'string') {
      errors.push('Canvas version must be a string');
    }

    // Check objects count
    if (Array.isArray(data.objects)) {
      if (data.objects.length > VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY) {
        errors.push(
          `Too many objects: ${data.objects.length} exceeds maximum of ${VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY}`,
        );
      }
    }

    // Check dimensions
    if (data.width !== undefined && typeof data.width !== 'number') {
      errors.push('Canvas width must be a number');
    }

    if (data.height !== undefined && typeof data.height !== 'number') {
      errors.push('Canvas height must be a number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate URL
   */
  validateUrl(url: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL must be a non-empty string' };
    }

    try {
      const parsedUrl = new URL(url);

      // Check protocol
      if (!['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) {
        return {
          isValid: false,
          error: `URL protocol ${parsedUrl.protocol} is not allowed`,
        };
      }

      // Check domain (for data URLs, skip domain check)
      if (parsedUrl.protocol !== 'data:') {
        // Allow Cloudinary and other trusted domains
        const allowedDomains = [
          'cloudinary.com',
          'res.cloudinary.com',
          'luneo.io',
          'luneo.com',
        ];

        const hostname = parsedUrl.hostname.toLowerCase();
        const isAllowed = allowedDomains.some((domain) =>
          hostname.includes(domain),
        );

        if (!isAllowed) {
          return {
            isValid: false,
            error: `URL domain ${hostname} is not in allowed list`,
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check design complexity
   */
  checkComplexity(canvasData: CanvasData): {
    complexity: number;
    isWithinLimit: boolean;
  } {
    const objects = Array.isArray(canvasData.objects) ? canvasData.objects : [];
    const complexity = objects.length;

    return {
      complexity,
      isWithinLimit: complexity <= VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY,
    };
  }
}
