/**
 * POST /api/credits/buy
 * Crée une session Stripe Checkout pour acheter des crédits IA
 * Forward vers backend NestJS: POST /credits/buy
 */

import { ApiResponseBuilder } from '@/lib/api-response';
import { z } from 'zod';
import { NextRequest } from 'next/server';

const buyCreditsSchema = z.object({
  packSize: z.enum(['100', '500', '1000']).transform(Number),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation
    const validation = buyCreditsSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Pack invalide. Packs disponibles: 100, 500, 1000',
        code: 'INVALID_PACK',
        details: validation.error.issues,
      };
    }

    const { packSize } = validation.data;

    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/credits/buy', request, {
      packSize,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/credits/buy', 'POST');
}
