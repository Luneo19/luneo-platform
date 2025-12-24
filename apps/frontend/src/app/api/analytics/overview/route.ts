import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/analytics/overview
 * Récupère un aperçu des analytics de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Calculer la date de début par défaut (30 jours)
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    const start = startDate || defaultStartDate.toISOString();

    // Récupérer les statistiques en parallèle
    const [
      designsCount,
      ordersCount,
      revenue,
      downloadsCount,
      activeUsers,
    ] = await Promise.all([
      // Nombre de designs créés
      supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lte('created_at', endDate)
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count designs for analytics', error, { userId: user.id });
          }
          return count || 0;
        }),

      // Nombre de commandes
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lte('created_at', endDate)
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count orders for analytics', error, { userId: user.id });
          }
          return count || 0;
        }),

      // Revenus totaux
      supabase
        .from('orders')
        .select('total_amount')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', start)
        .lte('created_at', endDate)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('calculate revenue for analytics', error, { userId: user.id });
            return 0;
          }
          return (data || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
        }),

      // Nombre de téléchargements
      supabase
        .from('downloads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('downloaded_at', start)
        .lte('downloaded_at', endDate)
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count downloads for analytics', error, { userId: user.id });
          }
          return count || 0;
        }),

      // Utilisateurs actifs (si admin/organisation)
      supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.id)
        .eq('status', 'active')
        .then(({ count, error }) => {
          if (error) {
            logger.dbError('count active users for analytics', error, { userId: user.id });
          }
          return count || 0;
        }),
    ]);

    const overview = {
      period: {
        startDate: start,
        endDate: endDate,
      },
      metrics: {
        designs: {
          count: designsCount,
          label: 'Designs créés',
        },
        orders: {
          count: ordersCount,
          label: 'Commandes',
        },
        revenue: {
          amount: revenue,
          currency: 'EUR',
          label: 'Revenus',
        },
        downloads: {
          count: downloadsCount,
          label: 'Téléchargements',
        },
        activeUsers: {
          count: activeUsers,
          label: 'Utilisateurs actifs',
        },
      },
    };

    logger.info('Analytics overview fetched', {
      userId: user.id,
      period: { start, endDate },
      metrics: {
        designs: designsCount,
        orders: ordersCount,
        revenue,
        downloads: downloadsCount,
        activeUsers,
      },
    });

    return {
      overview,
      message: 'Aperçu des analytics récupéré avec succès',
    };
  }, '/api/analytics/overview', 'GET');
}
