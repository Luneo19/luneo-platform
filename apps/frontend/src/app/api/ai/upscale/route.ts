/**
 * Upscale API Route (Optimisée)
 * Agrandissement d'images avec Real-ESRGAN via Replicate
 * Forward vers backend NestJS: POST /ai/upscale
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';

const schema = z.object({
  imageUrl: z.string().url(),
  scale: z.enum(['2', '4']).default('2'),
  enhanceDetails: z.boolean().default(true),
  denoiseStrength: z.number().min(0).max(1).default(0.3),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const input = schema.parse(body);

    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/ai/upscale', request, {
      imageUrl: input.imageUrl,
      scale: input.scale,
      enhanceDetails: input.enhanceDetails,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/ai/upscale', 'POST');
}
