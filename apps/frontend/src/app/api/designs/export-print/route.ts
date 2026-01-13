/**
 * POST /api/designs/export-print
 * Exporte un design pour l'impression (PDF, PNG, JPG, SVG haute résolution)
 * Forward vers backend NestJS: POST /designs/export-print
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { z } from 'zod';
import { forwardPost } from '@/lib/backend-forward';

const exportPrintSchema = z.object({
  designId: z.string().min(1),
  format: z.enum(['pdf', 'png', 'jpg', 'svg']).optional().default('pdf'),
  quality: z.enum(['low', 'medium', 'high', 'ultra']).optional().default('high'),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    const validation = exportPrintSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Erreurs de validation',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { designId, format, quality, dimensions } = validation.data;

    // Forward vers le backend
    const result = await forwardPost('/designs/export-print', request, {
      designId,
      format,
      quality,
      dimensions,
    });

    const resultData = result.data as any;
    return {
      fileUrl: resultData?.fileUrl,
      fileSize: resultData?.fileSize,
      format,
      quality,
      dimensions,
    };
  }, '/api/designs/export-print', 'POST');
}
