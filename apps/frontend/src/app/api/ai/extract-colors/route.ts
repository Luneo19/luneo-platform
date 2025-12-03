/**
 * Color Extraction API
 * AI-005: Extraction automatique de palette de couleurs
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const requestSchema = z.object({
  imageUrl: z.string().url(),
  maxColors: z.number().min(1).max(12).default(6),
  includeNeutral: z.boolean().default(false),
});

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
  name?: string;
}

// Color names database (simplified)
const colorNames: Record<string, string> = {
  '#FF0000': 'Rouge',
  '#00FF00': 'Vert',
  '#0000FF': 'Bleu',
  '#FFFF00': 'Jaune',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#FFA500': 'Orange',
  '#800080': 'Violet',
  '#FFC0CB': 'Rose',
  '#A52A2A': 'Marron',
  '#808080': 'Gris',
  '#000000': 'Noir',
  '#FFFFFF': 'Blanc',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { imageUrl, maxColors, includeNeutral } = validation.data;

    logger.info('Color extraction requested', { maxColors, includeNeutral });

    // Generate realistic mock colors
    // In production, use Canvas API, sharp, or AI service for real extraction
    const colors = generateMockColorPalette(maxColors, includeNeutral);
    const dominantColor = colors[0].hex;
    const palette = colors.map((c) => c.hex);

    return NextResponse.json({
      success: true,
      colors,
      dominantColor,
      palette,
      provider: 'demo',
    });
  } catch (error) {
    logger.error('Color extraction error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate mock color palette
function generateMockColorPalette(maxColors: number, includeNeutral: boolean): ExtractedColor[] {
  const baseColors = [
    { hex: '#3B82F6', name: 'Bleu Royal' },
    { hex: '#10B981', name: 'Vert Émeraude' },
    { hex: '#F59E0B', name: 'Ambre' },
    { hex: '#EF4444', name: 'Rouge Corail' },
    { hex: '#8B5CF6', name: 'Violet' },
    { hex: '#EC4899', name: 'Rose Vif' },
    { hex: '#14B8A6', name: 'Turquoise' },
    { hex: '#F97316', name: 'Orange' },
  ];

  const neutralColors = [
    { hex: '#1F2937', name: 'Gris Foncé' },
    { hex: '#6B7280', name: 'Gris' },
    { hex: '#F3F4F6', name: 'Gris Clair' },
    { hex: '#FFFFFF', name: 'Blanc' },
  ];

  let selectedColors = [...baseColors];
  if (includeNeutral) {
    selectedColors = [...baseColors, ...neutralColors];
  }

  // Shuffle and pick random colors
  selectedColors = selectedColors
    .sort(() => Math.random() - 0.5)
    .slice(0, maxColors);

  // Calculate percentages
  let remaining = 100;
  const colors: ExtractedColor[] = selectedColors.map((color, index) => {
    const isLast = index === selectedColors.length - 1;
    const percentage = isLast ? remaining : Math.floor(Math.random() * (remaining / 2)) + 5;
    remaining -= percentage;

    const rgb = hexToRgb(color.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return {
      hex: color.hex,
      rgb,
      hsl,
      percentage,
      name: color.name,
    };
  });

  // Sort by percentage
  return colors.sort((a, b) => b.percentage - a.percentage);
}

// Helper: Hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Helper: RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}


