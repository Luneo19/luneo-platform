import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (default: 100px)
  enabled?: boolean; // Enable/disable infinite scroll
}

interface UseInfiniteScrollReturn {
  loadMoreRef: React.RefObject<HTMLDivElement>;
  isNearBottom: boolean;
}

/**
 * Hook pour implémenter l'infinite scroll
 * Usage:
 * 
 * const { loadMoreRef, isNearBottom } = useInfiniteScroll({
 *   threshold: 200,
 *   enabled: !loading && hasMore
 * });
 * 
 * useEffect(() => {
 *   if (isNearBottom) {
 *     loadMore();
 *   }
 * }, [isNearBottom]);
 * 
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={loadMoreRef} />
 *   </div>
 * );
 */
export function useInfiniteScroll(
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 100, enabled = true } = options;
  const [isNearBottom, setIsNearBottom] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && enabled) {
        setIsNearBottom(true);
        // Reset après un court délai pour permettre un nouveau trigger
        setTimeout(() => setIsNearBottom(false), 100);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!loadMoreRef.current || !enabled) return;

    // Créer l'observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    // Observer l'élément
    observerRef.current.observe(loadMoreRef.current);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, enabled]);

  return { loadMoreRef, isNearBottom };
}

/**
 * Hook pour gérer la pagination avec infinite scroll
 */
export function useInfinitePagination<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  limit: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, limit);
      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err: any) {
      logger.error('Error loading more items', {
        error: err,
        page,
        limit,
        message: err.message,
      });
      setError(err.message || 'Failed to load more items');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, limit, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (page === 1 && items.length === 0) {
      loadMore();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
}

