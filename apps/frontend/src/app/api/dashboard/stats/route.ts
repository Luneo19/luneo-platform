import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { cacheService, cacheKeys, cacheTTL } from '@/lib/cache/redis';

/**
 * GET /api/dashboard/stats
 * Récupère les statistiques du dashboard pour l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, all

    // Vérifier le cache
    const cacheKey = `dashboard:stats:${user.id}:${period}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Dashboard stats served from cache', { userId: user.id, period });
      // ApiResponseBuilder.handle() wrapper automatiquement, on retourne directement les données
      return cached;
    }

    // Calculer la date de début selon la période
    let startDate: Date | null = null;
    switch (period) {
      case '7d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate = null;
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }

    // Récupérer les statistiques en parallèle
    const [
      designsCount,
      ordersCount,
      productsCount,
      collectionsCount,
      recentDesigns,
      recentOrders,
    ] = await Promise.all([
      // Nombre total de designs
      supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count designs', error, { userId: user.id });
            return 0;
          }
          return count || 0;
        }),

      // Nombre total de commandes
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count orders', error, { userId: user.id });
            return 0;
          }
          return count || 0;
        }),

      // Nombre total de produits
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count products', error, { userId: user.id });
            return 0;
          }
          return count || 0;
        }),

      // Nombre total de collections
      supabase
        .from('design_collections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count collections', error, { userId: user.id });
            return 0;
          }
          return count || 0;
        }),

      // Designs récents (5 derniers)
      supabase
        .from('designs')
        .select('id, prompt, preview_url, created_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch recent designs', error, { userId: user.id });
            return [];
          }
          return data || [];
        }),

      // Commandes récentes (5 dernières)
      supabase
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch recent orders', error, { userId: user.id });
            return [];
          }
          return data || [];
        }),
    ]);

    // Statistiques avec période
    let periodStats = {
      designs: 0,
      orders: 0,
      revenue: 0,
    };

    if (startDate) {
      const periodDesignsQuery = supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      const periodOrdersQuery = supabase
        .from('orders')
        .select('total_amount', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      const [periodDesigns, periodOrders] = await Promise.all([
        periodDesignsQuery.then(({ count, error }) => {
          if (error) {
            logger.dbError('count period designs', error, { userId: user.id });
            return 0;
          }
          return count || 0;
        }),
        periodOrdersQuery.then(({ data, error }) => {
          if (error) {
            logger.dbError('count period orders', error, { userId: user.id });
            return { count: 0, revenue: 0 };
          }
          const revenue = (data || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
          return { count: data?.length || 0, revenue };
        }),
      ]);

      periodStats = {
        designs: periodDesigns,
        orders: periodOrders.count,
        revenue: periodOrders.revenue,
      };
    }

    logger.info('Dashboard stats fetched', {
      userId: user.id,
      period,
      designsCount,
      ordersCount,
    });

    const result = {
      overview: {
        designs: designsCount,
        orders: ordersCount,
        products: productsCount,
        collections: collectionsCount,
      },
      period: {
        ...periodStats,
        period,
        startDate: startDate?.toISOString() || null,
      },
      recent: {
        designs: recentDesigns,
        orders: recentOrders,
      },
    };

    // Mettre en cache (5 minutes TTL)
    await cacheService.set(cacheKey, result, { ttl: cacheTTL.dashboardStats });

    // ApiResponseBuilder.handle() wrapper automatiquement avec { success: true, data: {...} }
    // On retourne directement les données, pas un NextResponse
    return result;
  }, '/api/dashboard/stats', 'GET');
}
