import { useCallback } from 'react';
import { useInfinitePagination } from './useInfiniteScroll';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface Design {
  id: string;
  prompt: string;
  generated_image_url: string;
  preview_url: string;
  style: string;
  status: string;
  created_at: string;
}

/**
 * Hook pour charger les designs avec infinite scroll
 */
export function useDesignsInfinite(filters?: { status?: string; style?: string; search?: string }) {
  const fetchDesigns = useCallback(async (page: number, limit: number) => {
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
        .from('designs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.style) {
        query = query.eq('style', filters.style);
      }

      if (filters?.search) {
        query = query.ilike('prompt', `%${filters.search}%`);
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
      logger.error('Error fetching designs', {
        error: err,
        page,
        limit,
        filters,
        message: err.message,
      });
      throw err;
    }
  }, [filters?.status, filters?.style, filters?.search]);

  return useInfinitePagination<Design>(fetchDesigns, 24); // 24 pour une grille de 4 colonnes
}

