/**
 * useClipart
 * Clipart browsing hook via tRPC
 */

'use client';

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';

interface ClipartCategory {
  id: string;
  name: string;
  thumbnail?: string;
  count?: number;
}

interface Clipart {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  categoryId: string;
}

interface UseClipartReturn {
  categories: ClipartCategory[];
  cliparts: Clipart[];
  isLoading: boolean;
  isLoadingClipart: boolean;
  error: Error | null;
  fetchCategories: () => void;
  fetchByCategory: (categoryId: string, page?: number, limit?: number) => void;
  addClipartToCanvas: (url: string) => Promise<string>;
  refetchCategories: () => void;
}

/**
 * Clipart browsing hook
 */
export function useClipart(onAddClipart?: (url: string) => Promise<string>): UseClipartReturn {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = trpc.visualCustomizer.assets.getClipartCategories.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const categories = (categoriesData as ClipartCategory[]) || [];

  // Fetch cliparts by category
  const {
    data: clipartsData,
    isLoading: isLoadingClipart,
    error: clipartError,
  } = trpc.visualCustomizer.assets.getClipartByCategory.useQuery(
    {
      categoryId: selectedCategoryId || '',
      page: 1,
      limit: 50,
    },
    {
      enabled: !!selectedCategoryId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const cliparts = (clipartsData?.cliparts as Clipart[]) || [];

  const fetchCategories = useCallback(() => {
    refetchCategories();
  }, [refetchCategories]);

  const fetchByCategory = useCallback(
    (categoryId: string, page = 1, limit = 50) => {
      setSelectedCategoryId(categoryId);
    },
    []
  );

  const addClipartToCanvas = useCallback(
    async (url: string): Promise<string> => {
      if (onAddClipart) {
        return onAddClipart(url);
      }

      // Fallback: generate ID
      const id = crypto.randomUUID();
      logger.warn('useClipart: onAddClipart callback not provided', { id, url });
      return id;
    },
    [onAddClipart]
  );

  return {
    categories,
    cliparts,
    isLoading: isLoadingCategories,
    isLoadingClipart,
    error: (categoriesError || clipartError) as Error | null,
    fetchCategories,
    fetchByCategory,
    addClipartToCanvas,
    refetchCategories,
  };
}
