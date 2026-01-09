import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/analytics/overview
 * Récupère un aperçu des analytics de l'utilisateur
 * Forward vers backend NestJS: GET /api/analytics/dashboard
 * Note: Le backend a /analytics/dashboard qui peut servir pour l'overview
 * TODO: Créer un endpoint spécifique /analytics/overview dans le backend ou utiliser /analytics/dashboard
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'last_30_days';

    // Utiliser /analytics/dashboard du backend qui retourne un dashboard complet
    const result = await forwardGet('/analytics/dashboard', request, {
      period,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    return result.data;
  }, '/api/analytics/overview', 'GET');
}
