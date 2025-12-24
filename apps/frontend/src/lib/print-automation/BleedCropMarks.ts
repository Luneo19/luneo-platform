/**
 * BleedCropMarks.ts - Ajout bleed (3mm) + crop marks
 * 
 * Handles bleed area and crop marks for professional printing
 * Ensures proper margins and cutting guides for print production
 */

import { logger } from '@/lib/logger';

export interface BleedSettings {
  bleedSize: number; // in mm
  safeArea: number; // in mm
  cropMarkLength: number; // in mm
  cropMarkThickness: number; // in mm
  cropMarkOffset: number; // in mm from edge
}

export interface PrintDimensions {
  width: number; // in mm
  height: number; // in mm
  unit: 'mm' | 'in' | 'px';
}

export interface CropMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'corner' | 'center' | 'registration';
}

export interface BleedArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
  totalWidth: number;
  totalHeight: number;
}

export class BleedCropMarks {
  private defaultSettings: BleedSettings = {
    bleedSize: 3, // 3mm standard bleed
    safeArea: 5, // 5mm safe area
    cropMarkLength: 8, // 8mm crop marks
    cropMarkThickness: 0.1, // 0.1mm line thickness
    cropMarkOffset: 2 // 2mm offset from edge
  };

  /**
   * Calculate bleed area for given dimensions
   */
  public calculateBleedArea(
    dimensions: PrintDimensions,
    settings: BleedSettings = this.defaultSettings
  ): BleedArea {
    const bleedSize = this.convertToPixels(settings.bleedSize, dimensions.unit);

    return {
      left: bleedSize,
      right: bleedSize,
      top: bleedSize,
      bottom: bleedSize,
      totalWidth: dimensions.width + (bleedSize * 2),
      totalHeight: dimensions.height + (bleedSize * 2)
    };
  }

  /**
   * Generate crop marks for all corners and centers
   */
  public generateCropMarks(
    dimensions: PrintDimensions,
    settings: BleedSettings = this.defaultSettings
  ): CropMark[] {
    const bleedSize = this.convertToPixels(settings.bleedSize, dimensions.unit);
    const cropLength = this.convertToPixels(settings.cropMarkLength, dimensions.unit);
    const cropThickness = this.convertToPixels(settings.cropMarkThickness, dimensions.unit);
    const cropOffset = this.convertToPixels(settings.cropMarkOffset, dimensions.unit);

    const marks: CropMark[] = [];

    // Corner crop marks
    marks.push(...this.generateCornerCropMarks(
      dimensions, bleedSize, cropLength, cropThickness, cropOffset
    ));

    // Center crop marks
    marks.push(...this.generateCenterCropMarks(
      dimensions, bleedSize, cropLength, cropThickness, cropOffset
    ));

    // Registration marks
    marks.push(...this.generateRegistrationMarks(
      dimensions, bleedSize, cropLength, cropThickness, cropOffset
    ));

    return marks;
  }

  /**
   * Generate corner crop marks
   */
  private generateCornerCropMarks(
    dimensions: PrintDimensions,
    bleedSize: number,
    cropLength: number,
    cropThickness: number,
    cropOffset: number
  ): CropMark[] {
    const marks: CropMark[] = [];

    // Top-left corner
    marks.push({
      x1: bleedSize - cropOffset,
      y1: bleedSize - cropOffset,
      x2: bleedSize - cropOffset + cropLength,
      y2: bleedSize - cropOffset,
      type: 'corner'
    });
    marks.push({
      x1: bleedSize - cropOffset,
      y1: bleedSize - cropOffset,
      x2: bleedSize - cropOffset,
      y2: bleedSize - cropOffset + cropLength,
      type: 'corner'
    });

    // Top-right corner
    marks.push({
      x1: bleedSize + dimensions.width + cropOffset - cropLength,
      y1: bleedSize - cropOffset,
      x2: bleedSize + dimensions.width + cropOffset,
      y2: bleedSize - cropOffset,
      type: 'corner'
    });
    marks.push({
      x1: bleedSize + dimensions.width + cropOffset,
      y1: bleedSize - cropOffset,
      x2: bleedSize + dimensions.width + cropOffset,
      y2: bleedSize - cropOffset + cropLength,
      type: 'corner'
    });

    // Bottom-left corner
    marks.push({
      x1: bleedSize - cropOffset,
      y1: bleedSize + dimensions.height + cropOffset - cropLength,
      x2: bleedSize - cropOffset + cropLength,
      y2: bleedSize + dimensions.height + cropOffset,
      type: 'corner'
    });
    marks.push({
      x1: bleedSize - cropOffset,
      y1: bleedSize + dimensions.height + cropOffset,
      x2: bleedSize - cropOffset,
      y2: bleedSize + dimensions.height + cropOffset,
      type: 'corner'
    });

    // Bottom-right corner
    marks.push({
      x1: bleedSize + dimensions.width + cropOffset - cropLength,
      y1: bleedSize + dimensions.height + cropOffset,
      x2: bleedSize + dimensions.width + cropOffset,
      y2: bleedSize + dimensions.height + cropOffset,
      type: 'corner'
    });
    marks.push({
      x1: bleedSize + dimensions.width + cropOffset,
      y1: bleedSize + dimensions.height + cropOffset - cropLength,
      x2: bleedSize + dimensions.width + cropOffset,
      y2: bleedSize + dimensions.height + cropOffset,
      type: 'corner'
    });

    return marks;
  }

  /**
   * Generate center crop marks
   */
  private generateCenterCropMarks(
    dimensions: PrintDimensions,
    bleedSize: number,
    cropLength: number,
    cropThickness: number,
    cropOffset: number
  ): CropMark[] {
    const marks: CropMark[] = [];
    const centerX = bleedSize + (dimensions.width / 2);
    const centerY = bleedSize + (dimensions.height / 2);
    const halfCropLength = cropLength / 2;

    // Top center
    marks.push({
      x1: centerX - halfCropLength,
      y1: bleedSize - cropOffset,
      x2: centerX + halfCropLength,
      y2: bleedSize - cropOffset,
      type: 'center'
    });

    // Bottom center
    marks.push({
      x1: centerX - halfCropLength,
      y1: bleedSize + dimensions.height + cropOffset,
      x2: centerX + halfCropLength,
      y2: bleedSize + dimensions.height + cropOffset,
      type: 'center'
    });

    // Left center
    marks.push({
      x1: bleedSize - cropOffset,
      y1: centerY - halfCropLength,
      x2: bleedSize - cropOffset,
      y2: centerY + halfCropLength,
      type: 'center'
    });

    // Right center
    marks.push({
      x1: bleedSize + dimensions.width + cropOffset,
      y1: centerY - halfCropLength,
      x2: bleedSize + dimensions.width + cropOffset,
      y2: centerY + halfCropLength,
      type: 'center'
    });

    return marks;
  }

  /**
   * Generate registration marks for color alignment
   */
  private generateRegistrationMarks(
    dimensions: PrintDimensions,
    bleedSize: number,
    cropLength: number,
    cropThickness: number,
    cropOffset: number
  ): CropMark[] {
    const marks: CropMark[] = [];
    const regMarkSize = cropLength * 0.8;
    const regMarkOffset = cropOffset + cropLength + 2;

    // Top-left registration mark
    marks.push({
      x1: bleedSize - regMarkOffset,
      y1: bleedSize - regMarkOffset,
      x2: bleedSize - regMarkOffset + regMarkSize,
      y2: bleedSize - regMarkOffset,
      type: 'registration'
    });
    marks.push({
      x1: bleedSize - regMarkOffset,
      y1: bleedSize - regMarkOffset,
      x2: bleedSize - regMarkOffset,
      y2: bleedSize - regMarkOffset + regMarkSize,
      type: 'registration'
    });

    // Top-right registration mark
    marks.push({
      x1: bleedSize + dimensions.width + regMarkOffset - regMarkSize,
      y1: bleedSize - regMarkOffset,
      x2: bleedSize + dimensions.width + regMarkOffset,
      y2: bleedSize - regMarkOffset,
      type: 'registration'
    });
    marks.push({
      x1: bleedSize + dimensions.width + regMarkOffset,
      y1: bleedSize - regMarkOffset,
      x2: bleedSize + dimensions.width + regMarkOffset,
      y2: bleedSize - regMarkOffset + regMarkSize,
      type: 'registration'
    });

    return marks;
  }

  /**
   * Convert units to pixels
   */
  private convertToPixels(value: number, unit: string): number {
    switch (unit) {
      case 'mm':
        return value * 3.7795275591; // 1mm = 3.78px at 96 DPI
      case 'in':
        return value * 96; // 1 inch = 96px at 96 DPI
      case 'px':
      default:
        return value;
    }
  }

  /**
   * Convert pixels to specified unit
   */
  public convertFromPixels(pixels: number, unit: string): number {
    switch (unit) {
      case 'mm':
        return pixels / 3.7795275591;
      case 'in':
        return pixels / 96;
      case 'px':
      default:
        return pixels;
    }
  }

  /**
   * Validate print dimensions
   */
  public validateDimensions(dimensions: PrintDimensions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dimensions.width <= 0) {
      errors.push('Width must be greater than 0');
    }
    if (dimensions.height <= 0) {
      errors.push('Height must be greater than 0');
    }
    if (!['mm', 'in', 'px'].includes(dimensions.unit)) {
      errors.push('Unit must be mm, in, or px');
    }

    // Check minimum dimensions
    const minWidth = this.convertToPixels(10, dimensions.unit); // 10mm minimum
    const minHeight = this.convertToPixels(10, dimensions.unit); // 10mm minimum

    if (dimensions.width < minWidth) {
      errors.push(`Width must be at least ${this.convertFromPixels(minWidth, dimensions.unit)}${dimensions.unit}`);
    }
    if (dimensions.height < minHeight) {
      errors.push(`Height must be at least ${this.convertFromPixels(minHeight, dimensions.unit)}${dimensions.unit}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get safe area for content placement
   */
  public getSafeArea(
    dimensions: PrintDimensions,
    settings: BleedSettings = this.defaultSettings
  ): { x: number; y: number; width: number; height: number } {
    const bleedSize = this.convertToPixels(settings.bleedSize, dimensions.unit);
    const safeArea = this.convertToPixels(settings.safeArea, dimensions.unit);

    return {
      x: bleedSize + safeArea,
      y: bleedSize + safeArea,
      width: dimensions.width - (safeArea * 2),
      height: dimensions.height - (safeArea * 2)
    };
  }

  /**
   * Generate print-ready canvas dimensions
   */
  public getPrintCanvasDimensions(
    dimensions: PrintDimensions,
    settings: BleedSettings = this.defaultSettings
  ): { width: number; height: number } {
    const bleedSize = this.convertToPixels(settings.bleedSize, dimensions.unit);
    const cropMarkSpace = this.convertToPixels(settings.cropMarkLength + settings.cropMarkOffset, dimensions.unit);

    return {
      width: dimensions.width + (bleedSize * 2) + (cropMarkSpace * 2),
      height: dimensions.height + (bleedSize * 2) + (cropMarkSpace * 2)
    };
  }

  /**
   * Create SVG crop marks
   */
  public generateSVGCropMarks(
    dimensions: PrintDimensions,
    settings: BleedSettings = this.defaultSettings
  ): string {
    const marks = this.generateCropMarks(dimensions, settings);
    const canvasDims = this.getPrintCanvasDimensions(dimensions, settings);
    
    let svg = `<svg width="${canvasDims.width}" height="${canvasDims.height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs><style>.crop-mark { stroke: #000000; stroke-width: ${settings.cropMarkThickness}; fill: none; }</style></defs>`;

    marks.forEach(mark => {
      svg += `<line x1="${mark.x1}" y1="${mark.y1}" x2="${mark.x2}" y2="${mark.y2}" class="crop-mark" />`;
    });

    svg += '</svg>';
    return svg;
  }

  /**
   * Get standard print settings for common formats
   */
  public getStandardSettings(format: 'business-card' | 'flyer' | 'poster' | 'banner'): {
    dimensions: PrintDimensions;
    settings: BleedSettings;
  } {
    switch (format) {
      case 'business-card':
        return {
          dimensions: { width: 85, height: 55, unit: 'mm' },
          settings: { ...this.defaultSettings, bleedSize: 3, safeArea: 3 }
        };
      case 'flyer':
        return {
          dimensions: { width: 210, height: 297, unit: 'mm' }, // A4
          settings: { ...this.defaultSettings, bleedSize: 3, safeArea: 5 }
        };
      case 'poster':
        return {
          dimensions: { width: 420, height: 594, unit: 'mm' }, // A2
          settings: { ...this.defaultSettings, bleedSize: 5, safeArea: 10 }
        };
      case 'banner':
        return {
          dimensions: { width: 841, height: 1189, unit: 'mm' }, // A1
          settings: { ...this.defaultSettings, bleedSize: 5, safeArea: 15 }
        };
      default:
        return {
          dimensions: { width: 210, height: 297, unit: 'mm' },
          settings: this.defaultSettings
        };
    }
  }

  /**
   * Calculate ink coverage for cost estimation
   */
  public calculateInkCoverage(
    dimensions: PrintDimensions,
    settings: BleedSettings = this.defaultSettings
  ): { area: number; cost: number } {
    const bleedArea = this.calculateBleedArea(dimensions, settings);
    const area = bleedArea.totalWidth * bleedArea.totalHeight;
    
    // Convert to square meters for cost calculation
    const areaInM2 = this.convertFromPixels(area, 'mm') / 1000000; // mm² to m²
    
    // Rough cost estimation (€0.50 per m²)
    const cost = areaInM2 * 0.5;
    
    return { area, cost };
  }

  /**
   * Add print marks to image buffer
   */
  public async addPrintMarks(
    imageBuffer: Buffer,
    options: {
      width: number;
      height: number;
      bleedSizePx: number;
      dpi?: number;
      includeCropMarks?: boolean;
      includeColorBars?: boolean;
      includeRegistrationMarks?: boolean;
    }
  ): Promise<Buffer> {
    const {
      width,
      height,
      bleedSizePx,
      dpi: _dpi = 300,
      includeCropMarks = true,
      includeColorBars = false,
      includeRegistrationMarks = false
    } = options;

    // Import sharp dynamically
    const sharp = (await import('sharp')).default;

    // Calculate final dimensions with bleed
    const finalWidth = width + (bleedSizePx * 2);
    const finalHeight = height + (bleedSizePx * 2);
    
    // Generate crop marks based on print dimensions
    const printDimensions: PrintDimensions = {
      width: finalWidth,
      height: finalHeight,
      unit: 'px'
    };
    
    const cropMarks = this.generateCropMarks(printDimensions, this.defaultSettings);
    
    // Create SVG overlay with print marks
    let svgOverlay = `<svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">`;
    
    if (includeCropMarks) {
      cropMarks.forEach(mark => {
        svgOverlay += `<line x1="${mark.x1}" y1="${mark.y1}" x2="${mark.x2}" y2="${mark.y2}" stroke="black" stroke-width="0.5"/>`;
      });
    }
    
    if (includeRegistrationMarks) {
      // Add registration marks (crosshairs) at corners
      const markSize = 10;
      const positions = [
        { x: bleedSizePx / 2, y: bleedSizePx / 2 },
        { x: finalWidth - bleedSizePx / 2, y: bleedSizePx / 2 },
        { x: bleedSizePx / 2, y: finalHeight - bleedSizePx / 2 },
        { x: finalWidth - bleedSizePx / 2, y: finalHeight - bleedSizePx / 2 }
      ];
      
      positions.forEach(pos => {
        // Circle
        svgOverlay += `<circle cx="${pos.x}" cy="${pos.y}" r="${markSize}" fill="none" stroke="black" stroke-width="0.5"/>`;
        // Horizontal line
        svgOverlay += `<line x1="${pos.x - markSize}" y1="${pos.y}" x2="${pos.x + markSize}" y2="${pos.y}" stroke="black" stroke-width="0.5"/>`;
        // Vertical line
        svgOverlay += `<line x1="${pos.x}" y1="${pos.y - markSize}" x2="${pos.x}" y2="${pos.y + markSize}" stroke="black" stroke-width="0.5"/>`;
      });
    }
    
    if (includeColorBars) {
      // Add CMYK color bars at bottom
      const barHeight = 20;
      const barY = finalHeight - bleedSizePx / 2 - barHeight;
      const barWidth = (finalWidth - bleedSizePx) / 5;
      
      const colors = [
        { name: 'C', color: '#00ffff' },
        { name: 'M', color: '#ff00ff' },
        { name: 'Y', color: '#ffff00' },
        { name: 'K', color: '#000000' },
        { name: 'RGB', color: '#ffffff' }
      ];
      
      colors.forEach((col, i) => {
        const x = bleedSizePx / 2 + (i * barWidth);
        svgOverlay += `<rect x="${x}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${col.color}" stroke="black" stroke-width="0.5"/>`;
        svgOverlay += `<text x="${x + barWidth / 2}" y="${barY + barHeight + 10}" text-anchor="middle" font-size="8" fill="black">${col.name}</text>`;
      });
    }
    
    svgOverlay += `</svg>`;
    
    // Composite SVG overlay onto image
    const svgBuffer = Buffer.from(svgOverlay);
    
    try {
      const result = await sharp(imageBuffer)
        .composite([{
          input: svgBuffer,
          blend: 'over'
        }])
        .png()
        .toBuffer();
      
      return result;
    } catch (error) {
      logger.error('Error adding print marks', {
        error,
        options,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      // Return original buffer if compositing fails
      return imageBuffer;
    }
  }
}

// Export singleton instance
export const bleedCropMarks = new BleedCropMarks();

// Export utility functions
export const calculateBleedArea = (
  dimensions: PrintDimensions,
  settings?: BleedSettings
): BleedArea => {
  return bleedCropMarks.calculateBleedArea(dimensions, settings);
};

export const generateCropMarks = (
  dimensions: PrintDimensions,
  settings?: BleedSettings
): CropMark[] => {
  return bleedCropMarks.generateCropMarks(dimensions, settings);
};

export const getSafeArea = (
  dimensions: PrintDimensions,
  settings?: BleedSettings
): { x: number; y: number; width: number; height: number } => {
  return bleedCropMarks.getSafeArea(dimensions, settings);
};
