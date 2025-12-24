import { useCallback } from 'react';
import { useInfinitePagination } from './useInfiniteScroll';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: any[];
}

/**
 * Hook pour charger les commandes avec infinite scroll
 */
export function useOrdersInfinite(filters?: { status?: string; search?: string }) {
  const fetchOrders = useCallback(async (page: number, limit: number) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Calculer l'offset
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Construire la requête
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Déterminer s'il y a plus de données
      const hasMore = count ? (page * limit) < count : false;

      return {
        data: data || [],
        hasMore,
      };
    } catch (err: any) {
      logger.error('Error fetching orders', {
        error: err,
        page,
        limit,
        filters,
        message: err.message,
      });
      throw err;
    }
  }, [filters?.status, filters?.search]);

  return useInfinitePagination<Order>(fetchOrders, 20);
}

