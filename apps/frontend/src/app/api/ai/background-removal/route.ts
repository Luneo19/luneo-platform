/**
 * Background Removal API (Optimisée)
 * AI-002: Suppression automatique d'arrière-plan avec Replicate rembg
 * Forward vers backend NestJS: POST /ai/background-removal
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';

const requestSchema = z.object({
  imageUrl: z.string().url(),
  mode: z.enum(['auto', 'person', 'product', 'animal']).default('auto'),
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

    const { imageUrl, mode } = validation.data;

    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/ai/background-removal', request, {
      imageUrl,
      mode,
    });

    return ApiResponseBuilder.success({
      outputUrl: (result.data as any)?.url,
      maskUrl: null,
      mode,
      provider: 'replicate',
    });
  }, '/api/ai/background-removal', 'POST');
}
