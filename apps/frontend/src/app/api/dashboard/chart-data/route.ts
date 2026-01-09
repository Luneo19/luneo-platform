import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/dashboard/chart-data
 * Récupère les données de graphiques pour le dashboard
 * Query params: period? (7d, 30d, 90d)
 * Forward vers backend NestJS: GET /api/analytics/dashboard?period=xxx
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Convertir period en format backend
    const backendPeriod = period === '7d' ? 'last_7_days' 
      : period === '30d' ? 'last_30_days'
      : period === '90d' ? 'last_90_days'
      : 'last_7_days';

    const result = await forwardGet('/analytics/dashboard', request, {
      period: backendPeriod,
    });

    // Transformer les données du backend en format attendu par le frontend
    const backendData = result.data;
    
    // Si le backend retourne des charts, les utiliser, sinon générer depuis les métriques
    if (backendData?.charts) {
      const { charts } = backendData;
      
      return {
        designs: charts.designsOverTime?.map((item: any) => item.count) || [],
        views: charts.viewsOverTime?.map((item: any) => item.count) || [],
        revenue: charts.revenueOverTime?.map((item: any) => item.amount) || [],
        conversion: backendData.metrics?.conversionRate || 0,
        conversionChange: 0.5, // TODO: Calculer depuis données précédentes
      };
    }

    // Fallback : utiliser les métriques pour générer des données de graphique
    const metrics = backendData?.metrics || {};
    return {
      designs: Array.from({ length: 7 }, () => Math.floor(metrics.totalDesigns / 7) || 0),
      views: Array.from({ length: 7 }, () => Math.floor(metrics.totalRenders / 7) || 0),
      revenue: Array.from({ length: 7 }, () => Math.floor((metrics.revenue || 0) / 7) || 0),
      conversion: metrics.conversionRate || 0,
      conversionChange: 0.5,
    };
  }, '/api/dashboard/chart-data', 'GET');
}
