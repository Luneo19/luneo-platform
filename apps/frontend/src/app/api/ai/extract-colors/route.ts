/**
 * Color Extraction API (Optimisée)
 * AI-005: Extraction automatique de palette de couleurs avec Sharp
 * Forward vers backend NestJS: POST /ai/extract-colors
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';

const requestSchema = z.object({
  imageUrl: z.string().url(),
  maxColors: z.number().min(1).max(12).default(6),
  includeNeutral: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
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

    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/ai/extract-colors', request, {
      imageUrl,
      maxColors,
      includeNeutral,
    });

    // Enrichir avec dominantColor et palette
    const colorsData = (result.data as any)?.colors || [];
    const dominantColor = colorsData[0]?.hex;
    const palette = colorsData.map((c: any) => c.hex);

    return ApiResponseBuilder.success({
      ...(result.data as any),
      dominantColor,
      palette,
      provider: 'sharp',
    });
  }, '/api/ai/extract-colors', 'POST');
}
