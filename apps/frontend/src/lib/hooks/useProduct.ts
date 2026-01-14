/**
 * ★★★ HOOK - USE PRODUCT ★★★
 * Hook personnalisé pour gérer les produits
 * - CRUD produits
 * - Upload modèles
 * - Analytics
 * - Cache management
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';

// ========================================
// TYPES
// ========================================

export interface UseProductOptions {
  productId?: string;
  autoFetch?: boolean;
  onUpdate?: (product: any) => void;
  onDelete?: () => void;
}

export interface UseProductListOptions {
  brandId?: string;
  category?: string;
  search?: string;
  limit?: number;
  autoFetch?: boolean;
}

// ========================================
// HOOK SINGLE PRODUCT
// ========================================

export function useProduct(options: UseProductOptions = {}) {
  const { productId, autoFetch = true, onUpdate, onDelete } = options;
  const router = useRouter();

  // Queries
  const productQuery = trpc.product.getById.useQuery(
    { id: productId! },
    { enabled: !!productId && autoFetch }
  );

  const analyticsQuery = trpc.product.getAnalytics.useQuery(
    { productId: productId! },
    { enabled: !!productId && autoFetch }
  );

  // Mutations
  const updateMutation = trpc.product.update.useMutation({
    onSuccess: (data) => {
      productQuery.refetch();
      onUpdate?.(data);
      logger.info('Product updated', { productId: data.id });
    },
  });

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      onDelete?.();
      logger.info('Product deleted', { productId });
      router.push('/products');
    },
  });

  const uploadModelMutation = trpc.product.uploadModel.useMutation({
    onSuccess: (data) => {
      productQuery.refetch();
      onUpdate?.(data);
      logger.info('Model uploaded', { productId: data.id });
    },
  });

  // ========================================
  // FUNCTIONS
  // ========================================

  const update = useCallback(
    async (data: any) => {
      if (!productId) return;
      return updateMutation.mutateAsync({ id: productId, ...data });
    },
    [productId, updateMutation]
  );

  const remove = useCallback(async () => {
    if (!productId) return;
    return deleteMutation.mutateAsync({ id: productId });
  }, [productId, deleteMutation]);

  const uploadModel = useCallback(
    async (fileUrl: string, fileName: string, fileSize: number, fileType: string) => {
      if (!productId) return;
      return uploadModelMutation.mutateAsync({
        productId,
        fileUrl,
        fileName,
        fileSize,
        fileType,
      });
    },
    [productId, uploadModelMutation]
  );

  const refetch = useCallback(() => {
    productQuery.refetch();
    analyticsQuery.refetch();
  }, [productQuery, analyticsQuery]);

  // ========================================
  // COMPUTED
  // ========================================

  const product = useMemo(() => productQuery.data, [productQuery.data]);
  const analytics = useMemo(() => analyticsQuery.data, [analyticsQuery.data]);
  const isLoading = useMemo(() => productQuery.isLoading, [productQuery.isLoading]);
  const isUpdating = useMemo(() => updateMutation.isPending, [updateMutation.isPending]);
  const isDeleting = useMemo(() => deleteMutation.isPending, [deleteMutation.isPending]);
  const isUploading = useMemo(() => uploadModelMutation.isPending, [uploadModelMutation.isPending]);

  // ========================================
  // RETURN
  // ========================================

  return {
    // Data
    product,
    analytics,

    // Loading states
    isLoading,
    isUpdating,
    isDeleting,
    isUploading,

    // Actions
    update,
    remove,
    uploadModel,
    refetch,

    // Errors
    error: productQuery.error || updateMutation.error || deleteMutation.error,
  };
}

// ========================================
// HOOK PRODUCT LIST
// ========================================

export function useProductList(options: UseProductListOptions = {}) {
  const {
    brandId,
    category,
    search,
    limit = 20,
    autoFetch = true,
  } = options;

  const [offset, setOffset] = useState(0);

  // Query
  const listQuery = trpc.product.list.useQuery(
    {
      brandId,
      category: category as any,
      search,
      limit,
      offset,
    },
    { enabled: autoFetch }
  );

  // ========================================
  // FUNCTIONS
  // ========================================

  const loadMore = useCallback(() => {
    if (listQuery.data?.hasMore) {
      setOffset((prev) => prev + limit);
    }
  }, [listQuery.data?.hasMore, limit]);

  const reset = useCallback(() => {
    setOffset(0);
    listQuery.refetch();
  }, [listQuery]);

  // ========================================
  // COMPUTED
  // ========================================

  const products = useMemo(() => listQuery.data?.products || [], [listQuery.data]);
  const total = useMemo(() => listQuery.data?.total || 0, [listQuery.data]);
  const hasMore = useMemo(() => listQuery.data?.hasMore || false, [listQuery.data]);

  // ========================================
  // RETURN
  // ========================================

  return {
    // Data
    products,
    total,
    hasMore,

    // Loading
    isLoading: listQuery.isLoading,

    // Actions
    loadMore,
    reset,
    refetch: listQuery.refetch,

    // Error
    error: listQuery.error,
  };
}

