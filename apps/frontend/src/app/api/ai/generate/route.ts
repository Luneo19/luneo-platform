/**
 * POST /api/ai/generate
 * Génère un design avec DALL-E 3
 * Forward vers backend NestJS: POST /ai/generate
 * Note: Le backend gère la génération, la vérification des crédits, et la déduction.
 * Le frontend peut ensuite uploader vers Cloudinary et sauvegarder le design si nécessaire.
 */

import { ApiResponseBuilder } from '@/lib/api-response';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const generateSchema = z.object({
  prompt: z.string().min(1, 'Le prompt est requis'),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
  quality: z.enum(['standard', 'hd']).default('standard'),
  style: z.enum(['vivid', 'natural']).default('vivid'),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = generateSchema.safeParse(body);

    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { prompt, size, quality, style } = validation.data;

    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/ai/generate', request, {
      prompt,
      size,
      quality,
      style,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/ai/generate', 'POST');
}
