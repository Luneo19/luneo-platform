/**
 * POST /api/ar/convert-usdz
 * Convertit un modèle GLB en USDZ
 * Forward vers backend NestJS: POST /ar-studio/convert-usdz
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { z } from 'zod';
import { forwardPost } from '@/lib/backend-forward';

const convertUSDZSchema = z.object({
  glb_url: z.string().url(),
  ar_model_id: z.string().optional(),
  product_name: z.string().max(200).optional(),
  scale: z.number().min(0.1).max(10).optional(),
  optimize: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    const validation = convertUSDZSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const input = validation.data;

    // Forward vers le backend
    const result = await forwardPost('/ar-studio/convert-usdz', request, {
      glb_url: input.glb_url,
      ar_model_id: input.ar_model_id,
      product_name: input.product_name,
      scale: input.scale,
      optimize: input.optimize,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/ar/convert-usdz', 'POST');
}
