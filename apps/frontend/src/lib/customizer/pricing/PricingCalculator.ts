/**
 * PricingCalculator
 * Calculates pricing based on design complexity
 */

import Konva from 'konva';

export interface PricingSettings {
  enabled?: boolean;
  pricePerText?: number;
  pricePerImage?: number;
  pricePerShape?: number;
  pricePerColor?: number;
  basePrice?: number;
  complexityMultiplier?: number;
  currency?: string;
}

export interface PriceItem {
  type: 'text' | 'image' | 'shape' | 'color' | 'base' | 'complexity';
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PricingResult {
  total: number;
  breakdown: PriceItem[];
}

/**
 * Calculates pricing for designs
 */
export class PricingCalculator {
  private settings: PricingSettings;

  constructor(settings: PricingSettings = {}) {
    this.settings = {
      pricePerText: 0.5,
      pricePerImage: 1.0,
      pricePerShape: 0.3,
      pricePerColor: 0.2,
      basePrice: 0,
      complexityMultiplier: 1.0,
      ...settings,
    };
  }

  /**
   * Calculates total price for layers
   */
  calculate(input: { layers: Array<{ id: string; type: string; metadata: Record<string, unknown> }> }): PricingResult {
    const settings = this.settings;

    const breakdown: PriceItem[] = [];

    // Count objects by type from layer metadata
    let textCount = 0;
    let imageCount = 0;
    let shapeCount = 0;
    const colors = new Set<string>();

    input.layers.forEach((layer) => {
      const metadata = layer.metadata || {};
      
      if (layer.type === 'text') {
        textCount++;
        const fill = metadata.fill as string;
        if (fill && typeof fill === 'string') {
          colors.add(fill);
        }
      } else if (layer.type === 'image') {
        imageCount++;
      } else if (layer.type === 'shape') {
        shapeCount++;
        const fill = metadata.fill as string;
        if (fill && typeof fill === 'string') {
          colors.add(fill);
        }
        const stroke = metadata.stroke as string;
        if (stroke && typeof stroke === 'string') {
          colors.add(stroke);
        }
      }
    });

    // Calculate text price
    if (textCount > 0 && settings.pricePerText) {
      breakdown.push({
        type: 'text',
        label: 'Text Elements',
        quantity: textCount,
        unitPrice: settings.pricePerText,
        total: textCount * settings.pricePerText,
      });
    }

    // Calculate image price
    if (imageCount > 0 && settings.pricePerImage) {
      breakdown.push({
        type: 'image',
        label: 'Images',
        quantity: imageCount,
        unitPrice: settings.pricePerImage,
        total: imageCount * settings.pricePerImage,
      });
    }

    // Calculate shape price
    if (shapeCount > 0 && settings.pricePerShape) {
      breakdown.push({
        type: 'shape',
        label: 'Shapes',
        quantity: shapeCount,
        unitPrice: settings.pricePerShape,
        total: shapeCount * settings.pricePerShape,
      });
    }

    // Calculate color price
    const uniqueColorCount = colors.size;
    if (uniqueColorCount > 0 && settings.pricePerColor) {
      breakdown.push({
        type: 'color',
        label: 'Unique Colors',
        quantity: uniqueColorCount,
        unitPrice: settings.pricePerColor,
        total: uniqueColorCount * settings.pricePerColor,
      });
    }

    // Base price
    if (settings.basePrice && settings.basePrice > 0) {
      breakdown.push({
        type: 'base',
        label: 'Base Price',
        quantity: 1,
        unitPrice: settings.basePrice,
        total: settings.basePrice,
      });
    }

    // Calculate subtotal
    const subtotal = breakdown.reduce((sum, item) => sum + item.total, 0);

    // Apply complexity multiplier
    if (settings.complexityMultiplier && settings.complexityMultiplier !== 1.0) {
      const complexityTotal = subtotal * (settings.complexityMultiplier - 1);
      breakdown.push({
        type: 'complexity',
        label: 'Complexity Adjustment',
        quantity: 1,
        unitPrice: complexityTotal,
        total: complexityTotal,
      });
    }

    const total = subtotal * (settings.complexityMultiplier || 1.0);

    return {
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
      breakdown,
    };
  }

  /**
   * Calculates price for text layers only
   */
  calculateTextPrice(textLayers: Array<{ id: string }>, pricePerText?: number): number {
    const price = pricePerText ?? this.settings.pricePerText ?? 0.5;
    return textLayers.length * price;
  }

  /**
   * Calculates price for image layers only
   */
  calculateImagePrice(imageLayers: Array<{ id: string }>, pricePerImage?: number): number {
    const price = pricePerImage ?? this.settings.pricePerImage ?? 1.0;
    return imageLayers.length * price;
  }

  /**
   * Calculates price for unique colors
   */
  calculateColorPrice(uniqueColors: string[], pricePerColor?: number): number {
    const price = pricePerColor ?? this.settings.pricePerColor ?? 0.2;
    return uniqueColors.length * price;
  }
}
