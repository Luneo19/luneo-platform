import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/analytics/top-pages
 * Récupère les pages les plus visitées
 * Query params: period? (7d, 30d, 90d)
 * Forward vers backend NestJS: GET /api/analytics/pages ou similaire
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Convertir period en format backend
    const backendPeriod = period === '7d' ? 'last_7_days' 
      : period === '30d' ? 'last_30_days'
      : period === '90d' ? 'last_90_days'
      : 'last_30_days';

    try {
      // Essayer de récupérer depuis le backend (si endpoint existe)
      const result = await forwardGet('/analytics/pages', request, {
        period: backendPeriod,
      }, { requireAuth: false }); // Permettre sans auth pour le moment

      return result.data || { pages: [] };
    } catch (error: any) {
      // Si l'endpoint n'existe pas encore, retourner un tableau vide
      // plutôt que des données mockées
      return { pages: [] };
    }
  }, '/api/analytics/top-pages', 'GET');
}
