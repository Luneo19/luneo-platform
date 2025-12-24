import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, getSortParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/orders/list
 * Récupère la liste des commandes avec pagination, tri et filtres
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const { sortBy, sortOrder } = getSortParams(searchParams, 'created_at', 'desc');

    // Filtres optionnels
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Construire la requête
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Appliquer les filtres
    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    // Appliquer le tri
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Appliquer la pagination
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      logger.dbError('fetch orders list', ordersError, {
        userId: user.id,
        page,
        limit,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des commandes' };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    logger.info('Orders list fetched', {
      userId: user.id,
      count: orders?.length || 0,
      total: count || 0,
      page,
      filters: { status, startDate, endDate },
    });

    return {
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, '/api/orders/list', 'GET');
}
