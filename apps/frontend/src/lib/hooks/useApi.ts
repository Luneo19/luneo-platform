/**
 * Hook professionnel pour les appels API
 * Gère les états de chargement, erreurs, et données de manière standardisée
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: {
    attempts: number;
    delay: number;
  };
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  refetch: () => Promise<T | null>;
}

/**
 * Hook pour exécuter une fonction API de manière asynchrone
 * Gère automatiquement les états de chargement, erreurs, et données
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { immediate = false, onSuccess, onError, retry } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Créer un nouveau AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);
      setError(null);
      retryCountRef.current = 0;

      const executeWithRetry = async (attempt: number): Promise<T | null> => {
        try {
          const result = await apiFunction(...args);
          
          // Vérifier si la requête a été annulée
          if (signal.aborted) {
            return null;
          }

          setData(result);
          setLoading(false);
          
          if (onSuccess) {
            onSuccess(result);
          }

          return result;
        } catch (err: any) {
          // Ignorer les erreurs d'annulation
          if (signal.aborted || err.name === 'AbortError') {
            return null;
          }

          const apiError = err instanceof Error ? err : new Error(err.message || 'Erreur API');

          // Retry si configuré
          if (retry && attempt < retry.attempts) {
            retryCountRef.current = attempt + 1;
            
            await new Promise(resolve => setTimeout(resolve, retry.delay));
            return executeWithRetry(attempt + 1);
          }

          setError(apiError);
          setLoading(false);
          
          logger.error('API call failed', apiError, { function: apiFunction.name, attempt });

          if (onError) {
            onError(apiError);
          }

          return null;
        }
      };

      return executeWithRetry(0);
    },
    [apiFunction, onSuccess, onError, retry]
  );

  const reset = useCallback(() => {
    // Annuler la requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setData(null);
    setError(null);
    setLoading(false);
    retryCountRef.current = 0;
  }, []);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup: annuler la requête si le composant est démonté
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate]); // Ne pas inclure execute pour éviter les re-renders infinis

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch,
  };
}

/**
 * Hook pour les mutations API (POST, PUT, DELETE)
 */
export function useMutation<T = any, V = any>(
  mutationFunction: (variables: V) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const apiResult = useApi<T>(mutationFunction, { ...options, immediate: false });

  const mutate = useCallback(
    async (variables: V) => {
      return apiResult.execute(variables);
    },
    [apiResult]
  );

  return {
    ...apiResult,
    mutate,
    mutateAsync: mutate,
  };
}

/**
 * Hook pour les requêtes API GET avec cache
 */
export function useQuery<T = any>(
  queryFunction: () => Promise<T>,
  options: UseApiOptions<T> & { enabled?: boolean } = {}
) {
  const { enabled = true, immediate = true, ...apiOptions } = options;
  
  const apiResult = useApi<T>(queryFunction, {
    ...apiOptions,
    immediate: enabled && immediate,
  });

  useEffect(() => {
    if (enabled && immediate) {
      apiResult.execute();
    }
  }, [enabled, immediate]); // Ne pas inclure execute pour éviter les re-renders infinis

  return {
    ...apiResult,
    isFetching: apiResult.loading,
    isError: !!apiResult.error,
    isSuccess: !!apiResult.data && !apiResult.error,
  };
}

/**
 * Interface pour la pagination
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Interface pour la réponse paginée
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Hook pour les requêtes paginées
 */
export function usePaginatedQuery<T = any>(
  queryFunction: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  options: {
    initialPage?: number;
    initialLimit?: number;
    enabled?: boolean;
  } = {}
) {
  const { initialPage = 1, initialLimit = 20, enabled = true } = options;
  
  const [page, setPage] = useState<number>(initialPage);
  const [limit] = useState<number>(initialLimit);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const offset = (page - 1) * limit;

  const apiResult = useApi<PaginatedResponse<T>>(
    () => queryFunction({ page, limit, offset }),
    {
      immediate: enabled,
      onSuccess: (data) => {
        setTotal(data.total);
        setHasMore(data.hasMore);
      },
    }
  );

  const nextPage = useCallback(() => {
    if (hasMore && !apiResult.loading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, apiResult.loading]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage);
    }
  }, [total, limit]);

  const refetch = useCallback(() => {
    return apiResult.execute();
  }, [apiResult]);

  useEffect(() => {
    if (enabled) {
      apiResult.execute();
    }
  }, [page, enabled]); // Ne pas inclure execute pour éviter les re-renders infinis

  return {
    ...apiResult,
    page,
    limit,
    total,
    hasMore,
    nextPage,
    previousPage,
    goToPage,
    refetch,
    isFetching: apiResult.loading,
    isError: !!apiResult.error,
    isSuccess: !!apiResult.data && !apiResult.error,
  };
}

