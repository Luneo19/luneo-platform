/**
 * Color Extraction API (Optimisée)
 * AI-005: Extraction automatique de palette de couleurs avec Sharp
 * Implémente extraction réelle depuis l'image
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';
import { AIService } from '@/lib/services/AIService';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { logger } from '@/lib/logger';
import { track } from '@vercel/analytics';

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

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const startTime = Date.now();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Non authentifié' };
    }

    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Paramètres invalides',
        details: validation.error.issues,
      };
    }

    const { imageUrl, maxColors, includeNeutral } = validation.data;

    // Extraction réelle avec Sharp
    const colors = await AIService.retryWithBackoff(async () => {
      // Télécharger et traiter l'image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Redimensionner pour accélérer le traitement
      const resized = await sharp(imageBuffer)
        .resize(200, 200, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = resized;
      const pixels = new Uint8Array(data);
      const colorMap = new Map<string, number>();

      // Compter occurrences de chaque couleur (quantifiée)
      for (let i = 0; i < pixels.length; i += info.channels) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Quantifier les couleurs (réduire palette)
        const quantizedR = Math.floor(r / 32) * 32;
        const quantizedG = Math.floor(g / 32) * 32;
        const quantizedB = Math.floor(b / 32) * 32;

        const key = `${quantizedR},${quantizedG},${quantizedB}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }

      // Trier par fréquence
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxColors * 2);

      // Filtrer couleurs neutres si demandé
      let filteredColors = sortedColors;
      if (!includeNeutral) {
        filteredColors = sortedColors.filter(([key]) => {
          const [r, g, b] = key.split(',').map(Number);
          const saturation = calculateSaturation(r, g, b);
          return saturation > 20; // Seuil de saturation
        });
      }

      // Prendre les N premières
      const topColors = filteredColors.slice(0, maxColors);
      const totalPixels = info.width * info.height;

      const extractedColors: ExtractedColor[] = topColors.map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        const percentage = Math.round((count / totalPixels) * 100);

        return {
          hex,
          rgb: { r, g, b },
          hsl,
          percentage,
          name: getColorName(hex),
        };
      });

      // Normaliser pourcentage
      const totalPercentage = extractedColors.reduce((sum, c) => sum + c.percentage, 0);
      extractedColors.forEach((c) => {
        c.percentage = Math.round((c.percentage / totalPercentage) * 100);
      });

      return extractedColors.sort((a, b) => b.percentage - a.percentage);
    });

    const dominantColor = colors[0].hex;
    const palette = colors.map((c) => c.hex);

    const duration = Date.now() - startTime;

    // Track analytics
    track('ai_color_extraction_success', {
      userId: user.id,
      duration,
      colorsFound: colors.length,
    });

    logger.info('Color extraction completed', {
      userId: user.id,
      duration,
      colorsFound: colors.length,
    });

    return ApiResponseBuilder.success({
      colors,
      dominantColor,
      palette,
      provider: 'sharp',
    });
  }, '/api/ai/extract-colors', 'POST');
}

// Helper functions
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

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

function calculateSaturation(r: number, g: number, b: number): number {
  const hsl = rgbToHsl(r, g, b);
  return hsl.s;
}

function getColorName(hex: string): string {
  // Base de données simplifiée (à étendre)
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
  return colorNames[hex] || hex;
}


