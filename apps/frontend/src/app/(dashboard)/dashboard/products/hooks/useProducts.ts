/**
 * Hook personnalisé pour la gestion des produits
 */

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { ProductFilters, SortOption, ProductDisplay } from '../types';
import type { ProductCategory } from '@/lib/types/product';

export function useProducts(
  filters: ProductFilters,
  sortOption: SortOption,
  page: number
) {
  // Query products
  const productsQuery = trpc.product.list.useQuery({
    search: filters.search || undefined,
    category: filters.category !== 'all' ? (filters.category as ProductCategory) : undefined,
    isActive: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
    limit: 50,
    offset: (page - 1) * 50,
  });

  // Transform products
  const products: ProductDisplay[] = useMemo(() => {
    return (productsQuery.data?.products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category || 'OTHER',
      image_url: p.imageUrl || p.images?.[0] || `https://picsum.photos/seed/${p.id}/400/400`,
      price: p.price || 0,
      currency: p.currency || 'EUR',
      isActive: p.isActive ?? true,
      status: p.status || 'ACTIVE',
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      views: p.views || 0,
      orders: p.orders || 0,
      sku: p.sku || '',
      tags: p.tags || [],
      model3dUrl: p.model3dUrl,
      baseAssetUrl: p.baseAssetUrl,
      images: p.images,
      metadata: p.metadata,
      brandId: p.brandId || '',
      createdBy: p.createdBy || '',
    }));
  }, [productsQuery.data]);

  // Filtered & Sorted Products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower) ||
          p.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply price filters
    if (filters.priceMin !== null) {
      filtered = filtered.filter((p) => p.price && p.price >= filters.priceMin!);
    }
    if (filters.priceMax !== null) {
      filtered = filtered.filter((p) => p.price && p.price <= filters.priceMax!);
    }

    // Apply active filter
    if (filters.isActive !== null) {
      filtered = filtered.filter((p) => p.isActive === filters.isActive);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortOption.field];
      let bValue: any = b[sortOption.field];

      if (sortOption.field === 'createdAt' || sortOption.field === 'updatedAt') {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOption.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [products, filters, sortOption]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const draft = products.filter((p) => p.status === 'DRAFT').length;
    const archived = products.filter((p) => p.status === 'ARCHIVED').length;
    const totalRevenue = products.reduce((sum, p) => sum + ((p.price || 0) * p.orders), 0);

    return { total, active, draft, archived, totalRevenue };
  }, [products]);

  return {
    products: filteredAndSortedProducts,
    stats,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
  };
}

