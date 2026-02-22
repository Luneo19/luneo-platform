/**
 * Hook personnalisé pour la gestion des produits
 */

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { ProductFilters, SortOption, ProductDisplay } from '../types';
import type { ProductCategory, ProductStatus } from '@/lib/types/product';

/** Raw product shape from trpc product.list */
interface RawProductFromApi {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  images?: string[];
  price?: number;
  currency?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  views?: number;
  orders?: number;
  sku?: string;
  tags?: string[];
  model3dUrl?: string;
  baseAssetUrl?: string;
  metadata?: Record<string, unknown>;
  brandId?: string;
  createdBy?: string;
}

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
    const rawList = (productsQuery.data?.products || []) as unknown as RawProductFromApi[];
    return rawList.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: (p.category || 'OTHER') as ProductCategory,
      image_url: p.imageUrl || p.images?.[0] || '/placeholder-design.svg',
      price: p.price || 0,
      currency: p.currency || 'EUR',
      isActive: p.isActive ?? true,
      status: (p.status || 'ACTIVE') as ProductStatus,
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
      const defaultVal =
        sortOption.field === 'createdAt' || sortOption.field === 'updatedAt' ? new Date(0) : '';
      let aValue: string | number | Date = (a[sortOption.field] ?? defaultVal) as string | number | Date;
      let bValue: string | number | Date = (b[sortOption.field] ?? defaultVal) as string | number | Date;

      if (sortOption.field === 'createdAt' || sortOption.field === 'updatedAt') {
        aValue = aValue instanceof Date ? aValue.getTime() : new Date(String(aValue)).getTime();
        bValue = bValue instanceof Date ? bValue.getTime() : new Date(String(bValue)).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (typeof bValue === 'string' ? bValue : String(bValue)).toLowerCase();
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

