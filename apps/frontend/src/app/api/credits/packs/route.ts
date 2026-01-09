import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/credits/packs
 * Récupère tous les packs de crédits disponibles
 * Forward vers backend NestJS: GET /api/credits/packs
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/credits/packs', request);
    
    // Le backend retourne directement un array, on le formate si nécessaire
    if (Array.isArray(result.data)) {
      return { packs: result.data };
    }
    
    return result.data || { packs: [] };
  }, '/api/credits/packs', 'GET');
}




















