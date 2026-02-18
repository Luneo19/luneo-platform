/**
 * ContentValidator
 * Client-side validation before submit
 */

import Konva from 'konva';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationSettings {
  maxTextLength?: number;
  blockedWords?: string[];
  minImageWidth?: number;
  minImageHeight?: number;
  maxImageWidth?: number;
  maxImageHeight?: number;
  maxComplexity?: number;
}

/**
 * Validates design content before submission
 */
export class ContentValidator {
  /**
   * Validates entire design
   */
  static validateDesign(
    layers: Konva.Node[],
    settings: ValidationSettings = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    const allNodes: Konva.Node[] = [];
    layers.forEach((layer) => {
      const container = layer as Konva.Container;
      const nodes = container.find ? container.find('.konva-node') : [];
      allNodes.push(...nodes);
    });

    // Validate text content
    allNodes.forEach((node) => {
      if (node instanceof Konva.Text) {
        const textResult = this.checkTextContent(
          node.text(),
          settings.maxTextLength,
          settings.blockedWords
        );
        if (!textResult.valid) {
          errors.push({
            field: `text-${node.id()}`,
            message: textResult.reason || 'Invalid text content',
            severity: 'error',
          });
        }
      }
    });

    // Validate image dimensions
    allNodes.forEach((node) => {
      if (node instanceof Konva.Image) {
        const box = node.getClientRect();
        const imageResult = this.checkImageDimensions(
          box.width,
          box.height,
          settings.minImageWidth,
          settings.minImageHeight,
          settings.maxImageWidth,
          settings.maxImageHeight
        );
        if (!imageResult.valid) {
          errors.push({
            field: `image-${node.id()}`,
            message: imageResult.reason || 'Invalid image dimensions',
            severity: 'error',
          });
        }
      }
    });

    // Check design complexity
    if (settings.maxComplexity) {
      const complexityResult = this.checkDesignComplexity(
        allNodes,
        settings.maxComplexity
      );
      if (!complexityResult.valid) {
        warnings.push({
          field: 'design',
          message: complexityResult.reason || 'Design complexity exceeds recommended limit',
          severity: 'warning',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Checks text content validity
   */
  static checkTextContent(
    text: string,
    maxLength?: number,
    blockedWords?: string[]
  ): { valid: boolean; reason?: string } {
    // Check length
    if (maxLength && text.length > maxLength) {
      return {
        valid: false,
        reason: `Text exceeds maximum length of ${maxLength} characters`,
      };
    }

    // Check blocked words
    if (blockedWords && blockedWords.length > 0) {
      const lowerText = text.toLowerCase();
      for (const word of blockedWords) {
        if (lowerText.includes(word.toLowerCase())) {
          return {
            valid: false,
            reason: `Text contains blocked word: ${word}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Checks image dimensions
   */
  static checkImageDimensions(
    width: number,
    height: number,
    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number
  ): { valid: boolean; reason?: string } {
    if (minWidth && width < minWidth) {
      return {
        valid: false,
        reason: `Image width ${width}px is less than minimum ${minWidth}px`,
      };
    }

    if (minHeight && height < minHeight) {
      return {
        valid: false,
        reason: `Image height ${height}px is less than minimum ${minHeight}px`,
      };
    }

    if (maxWidth && width > maxWidth) {
      return {
        valid: false,
        reason: `Image width ${width}px exceeds maximum ${maxWidth}px`,
      };
    }

    if (maxHeight && height > maxHeight) {
      return {
        valid: false,
        reason: `Image height ${height}px exceeds maximum ${maxHeight}px`,
      };
    }

    return { valid: true };
  }

  /**
   * Checks design complexity
   */
  static checkDesignComplexity(
    nodes: Konva.Node[],
    maxComplexity: number
  ): { valid: boolean; reason?: string } {
    // Calculate complexity score
    let complexity = 0;

    nodes.forEach((node) => {
      // Base complexity per node
      complexity += 1;

      // Additional complexity for filters
      if (node instanceof Konva.Image) {
        const filters = node.filters() || [];
        complexity += filters.length * 0.5;
      }

      // Additional complexity for groups
      if (node instanceof Konva.Group) {
        complexity += node.getChildren().length * 0.3;
      }

      // Additional complexity for transformations
      if (node.rotation() !== 0) {
        complexity += 0.2;
      }
      if (node.scaleX() !== 1 || node.scaleY() !== 1) {
        complexity += 0.2;
      }
    });

    if (complexity > maxComplexity) {
      return {
        valid: false,
        reason: `Design complexity ${complexity.toFixed(1)} exceeds maximum ${maxComplexity}`,
      };
    }

    return { valid: true };
  }
}
