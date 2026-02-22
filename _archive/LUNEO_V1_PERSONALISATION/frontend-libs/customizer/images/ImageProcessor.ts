/**
 * ImageProcessor
 * Konva image filters and effects
 */

import Konva from 'konva';

export enum FilterType {
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation',
  BLUR = 'blur',
  GRAYSCALE = 'grayscale',
  SEPIA = 'sepia',
  INVERT = 'invert',
}

/**
 * Applies image filters using Konva filters
 */
export class ImageProcessor {
  /**
   * Applies a filter to an image
   */
  static applyFilter(image: Konva.Image, filter: FilterType, value: number): void {
    switch (filter) {
      case FilterType.BRIGHTNESS:
        this.applyBrightness(image, value);
        break;
      case FilterType.CONTRAST:
        this.applyContrast(image, value);
        break;
      case FilterType.SATURATION:
        this.applySaturation(image, value);
        break;
      case FilterType.BLUR:
        this.applyBlur(image, value);
        break;
      case FilterType.GRAYSCALE:
        this.applyGrayscale(image);
        break;
      case FilterType.SEPIA:
        this.applySepia(image);
        break;
      case FilterType.INVERT:
        this.applyInvert(image);
        break;
    }
  }

  /**
   * Applies brightness filter (-1 to 1)
   */
  static applyBrightness(image: Konva.Image, value: number): void {
    const clampedValue = Math.max(-1, Math.min(1, value));
    image.brightness(clampedValue);
    image.getLayer()?.batchDraw();
  }

  /**
   * Applies contrast filter (-100 to 100)
   */
  static applyContrast(image: Konva.Image, value: number): void {
    const clampedValue = Math.max(-100, Math.min(100, value));
    image.contrast(clampedValue);
    image.getLayer()?.batchDraw();
  }

  /**
   * Applies saturation filter (-2 to 10)
   */
  static applySaturation(image: Konva.Image, value: number): void {
    const clampedValue = Math.max(-2, Math.min(10, value));
    // Konva doesn't have saturate() method, use filters instead
    if (clampedValue === 0) {
      // Remove saturation filter
      const filters = image.filters() || [];
      image.filters(filters.filter((f) => f !== Konva.Filters.HSL));
    } else {
      // Apply HSL filter for saturation
      const filters = image.filters() || [];
      if (!filters.includes(Konva.Filters.HSL)) {
        image.filters([...filters, Konva.Filters.HSL]);
      }
      // Note: Konva HSL filter doesn't directly support saturation value
      // This is a workaround - for full saturation control, you'd need a custom filter
      image.cache();
    }
    image.getLayer()?.batchDraw();
  }

  /**
   * Applies blur filter (0 to 40)
   */
  static applyBlur(image: Konva.Image, radius: number): void {
    const clampedRadius = Math.max(0, Math.min(40, radius));
    image.blurRadius(clampedRadius);
    image.cache();
    image.getLayer()?.batchDraw();
  }

  /**
   * Applies grayscale filter
   */
  static applyGrayscale(image: Konva.Image): void {
    image.filters([Konva.Filters.Grayscale]);
    image.cache();
    image.getLayer()?.batchDraw();
  }

  /**
   * Applies sepia filter
   */
  static applySepia(image: Konva.Image): void {
    image.filters([Konva.Filters.Sepia]);
    image.cache();
    image.getLayer()?.batchDraw();
  }

  /**
   * Applies invert filter
   */
  static applyInvert(image: Konva.Image): void {
    image.filters([Konva.Filters.Invert]);
    image.cache();
    image.getLayer()?.batchDraw();
  }

  /**
   * Resets all filters
   */
  static resetFilters(image: Konva.Image): void {
    image.brightness(0);
    image.contrast(0);
    // Remove saturation filter (no direct method)
    const filters = image.filters() || [];
    image.filters(filters.filter((f) => f !== Konva.Filters.HSL));
    image.blurRadius(0);
    image.cache();
    image.getLayer()?.batchDraw();
  }

  /**
   * Gets current filter values
   */
  static getFilterValues(image: Konva.Image): {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    hasGrayscale: boolean;
    hasSepia: boolean;
    hasInvert: boolean;
  } {
    const filters = image.filters() || [];
    return {
      brightness: image.brightness() || 0,
      contrast: image.contrast() || 0,
      saturation: 0, // Konva doesn't have saturate() getter
      blur: image.blurRadius() || 0,
      hasGrayscale: filters.includes(Konva.Filters.Grayscale),
      hasSepia: filters.includes(Konva.Filters.Sepia),
      hasInvert: filters.includes(Konva.Filters.Invert),
    };
  }
}
