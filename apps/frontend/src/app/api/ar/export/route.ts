/**
 * POST /api/ar/export
 * Exporte un modèle AR en différents formats (GLB, USDZ)
 * Forward vers backend NestJS: POST /ar-studio/export
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { z } from 'zod';
import { forwardPost } from '@/lib/backend-forward';

const exportARSchema = z.object({
  ar_model_id: z.string().min(1),
  format: z.enum(['glb', 'usdz']),
  optimize: z.boolean().optional().default(true),
  include_textures: z.boolean().optional().default(true),
  compression_level: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    const validation = exportARSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Erreurs de validation',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const input = validation.data;

    // Forward vers le backend
    const result = await forwardPost('/ar-studio/export', request, {
      ar_model_id: input.ar_model_id,
      format: input.format,
      optimize: input.optimize,
      include_textures: input.include_textures,
      compression_level: input.compression_level,
    });

    return result.data;
  }, '/api/ar/export', 'POST');
}
