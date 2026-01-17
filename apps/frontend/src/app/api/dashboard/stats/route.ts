import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';
import { logger } from '@/lib/logger';

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
      // ✅ Forward vers backend avec authentification (cookies httpOnly transmis automatiquement)
      // Endpoint: /api/v1/analytics/dashboard (le /v1 est ajouté par getBackendUrl)
      const analyticsResult = await forwardGet('/v1/analytics/dashboard', request, {
        period: backendPeriod,
      }, { requireAuth: true }); // ✅ Auth requise via cookies httpOnly
      
      const backendData = (analyticsResult.data || {}) as {
        metrics?: { totalDesigns?: number; totalRenders?: number; conversionRate?: number; revenue?: number; [key: string]: any };
        charts?: { [key: string]: any };
        [key: string]: any;
      };
      const metrics = backendData.metrics || {};
      const charts = backendData.charts || {};
      
      // ✅ Récupérer designs et orders récents en parallèle pour compléter les données
      let recentDesigns: any[] = [];
      let recentOrders: any[] = [];
      
      try {
        // Récupérer les 5 derniers designs
        const designsResult = await forwardGet('/v1/designs', request, {
          limit: 5,
          page: 1,
        }, { requireAuth: true });
        
        if (designsResult.success && designsResult.data) {
          const designsData = designsResult.data as { data?: any[] };
          if (designsData.data && Array.isArray(designsData.data)) {
            recentDesigns = designsData.data.map((design: any) => ({
            id: design.id,
            prompt: design.name || design.prompt || 'Design sans titre',
            preview_url: design.imageUrl || design.previewUrl,
            created_at: design.createdAt,
            status: design.status,
            }));
          }
        }
      } catch (designError) {
        logger.debug('Failed to fetch recent designs', { error: designError });
        // Continuer sans designs récents
      }
      
      try {
        // Récupérer les 5 dernières commandes
        const ordersResult = await forwardGet('/v1/orders', request, {
          limit: 5,
          page: 1,
        }, { requireAuth: true });
        
        if (ordersResult.success && ordersResult.data) {
          const ordersData = ordersResult.data as { data?: any[] };
          if (ordersData.data && Array.isArray(ordersData.data)) {
            recentOrders = ordersData.data.map((order: any) => ({
            id: order.id,
            status: order.status,
            total_amount: (order.totalCents || 0) / 100, // Convertir cents en euros
            created_at: order.createdAt,
            }));
          }
        }
      } catch (orderError) {
        logger.debug('Failed to fetch recent orders', { error: orderError });
        // Continuer sans orders récents
      }
      
      // Calculer orders depuis conversionRate et totalRenders si non disponible directement
      // conversionRate = (orders / renders) * 100, donc orders = (conversionRate * renders) / 100
      const estimatedOrders = metrics.conversionRate && metrics.totalRenders
        ? Math.round((metrics.conversionRate * metrics.totalRenders) / 100)
        : 0;
      
      // ✅ Transformer en format attendu par useDashboardData
      return {
        overview: {
          designs: metrics.totalDesigns || 0,
          orders: estimatedOrders,
          products: 0, // TODO: Récupérer depuis backend si disponible
          collections: 0, // TODO: Récupérer depuis backend si disponible
        },
        period: {
          designs: metrics.totalDesigns || 0,
          orders: estimatedOrders,
          revenue: metrics.revenue || 0,
          period: backendPeriod,
        },
        recent: {
          designs: recentDesigns,
          orders: recentOrders,
        },
      };
    } catch (error: any) {
      // Si erreur backend (401, 403, etc.), retourner structure vide mais cohérente
      logger.warn('Backend dashboard request failed', {
        error: error?.message || error,
        period: backendPeriod,
      });
      
      return {
        overview: {
          designs: 0,
          orders: 0,
          products: 0,
          collections: 0,
        },
        period: {
          designs: 0,
          orders: 0,
          revenue: 0,
          period: backendPeriod,
        },
        recent: {
          designs: [],
          orders: [],
        },
      };
    }
  }, '/api/dashboard/stats', 'GET');
}
