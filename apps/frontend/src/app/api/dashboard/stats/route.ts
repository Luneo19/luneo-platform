import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/dashboard/stats
 * Récupère les statistiques du dashboard pour l'utilisateur
 * Query params: period? (7d, 30d, 90d, all)
 * Forward vers backend NestJS: GET /api/analytics/dashboard?period=xxx
 * Note: Le backend retourne actuellement des données mockées, à corriger en Phase 2
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Convertir period en format backend (last_7_days, last_30_days, etc.)
    const backendPeriod = period === '7d' ? 'last_7_days' 
      : period === '30d' ? 'last_30_days'
      : period === '90d' ? 'last_90_days'
      : 'last_30_days';

    try {
      const result = await forwardGet('/analytics/dashboard', request, {
        period: backendPeriod,
      }, { requireAuth: false }); // Permettre sans auth pour le moment
      
      return result.data || {};
    } catch (error: any) {
      // Si erreur backend, retourner un objet vide avec structure minimale
      return {
        totalDesigns: 0,
        totalRenders: 0,
        revenue: 0,
        conversionRate: 0,
      };
    }
  }, '/api/dashboard/stats', 'GET');
}
