/**
 * Smart Crop API Route (Optimisée)
 * Recadrage intelligent d'images avec détection de focus
 * Forward vers backend NestJS: POST /ai/smart-crop
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';

const schema = z.object({
  imageUrl: z.string().url(),
  targetAspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).default('1:1'),
  focusPoint: z.enum(['auto', 'face', 'center', 'product']).default('auto'),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Paramètres invalides',
        details: validation.error.issues,
      };
    }

    const input = validation.data;

    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/ai/smart-crop', request, {
      imageUrl: input.imageUrl,
      targetAspectRatio: input.targetAspectRatio,
      focusPoint: input.focusPoint,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/ai/smart-crop', 'POST');
}
