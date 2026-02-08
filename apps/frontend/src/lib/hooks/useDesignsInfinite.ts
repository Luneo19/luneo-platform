import { useCallback } from 'react';
import { useInfinitePagination } from './useInfiniteScroll';
import { endpoints } from '@/lib/api/client';
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

// Map backend design to hook shape
function mapDesign(d: Record<string, unknown>): Design {
  return {
    id: (d.id as string) ?? '',
    prompt: (d.prompt as string) ?? '',
    generated_image_url: String(d.imageUrl ?? d.generated_image_url ?? ''),
    preview_url: String(d.previewUrl ?? d.preview_url ?? ''),
    style: (d.style as string) ?? 'default',
    status: (d.status as string) ?? 'draft',
    created_at: String(d.createdAt ?? d.created_at ?? ''),
  };
}

/**
 * Hook pour charger les designs avec infinite scroll via le backend NestJS
 */
export function useDesignsInfinite(filters?: { status?: string; style?: string; search?: string }) {
  const fetchDesigns = useCallback(
    async (page: number, limit: number) => {
      try {
        const res = await endpoints.designs.list({
          page,
          limit,
          status: filters?.status,
          search: filters?.search,
        });
        const raw = res as { designs?: unknown[]; data?: unknown[]; pagination?: { hasNext?: boolean; total?: number } };
        const list = raw.designs ?? raw.data ?? (Array.isArray(res) ? res : []);
        const pagination = raw.pagination;
        const total = pagination?.total ?? (list as unknown[]).length;
        const hasMore = pagination?.hasNext ?? (page * limit < total);
        const data = (list as Record<string, unknown>[]).map(mapDesign);
        return { data, hasMore };
      } catch (err: unknown) {
        logger.error('Error fetching designs', {
          error: err,
          page,
          limit,
          filters,
          message: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    [filters?.status, filters?.style, filters?.search]
  );

  return useInfinitePagination<Design>(fetchDesigns, 24);
}
