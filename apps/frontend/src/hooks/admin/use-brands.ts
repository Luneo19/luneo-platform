/**
 * USE BRANDS HOOK
 * Hook SWR for brand/tenant list with pagination and filters
 */
import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { normalizeListResponse } from '@/lib/api/normalize';

class FetcherError extends Error {
  info?: unknown;
  status?: number;
  constructor(message: string, options?: { info?: unknown; status?: number }) {
    super(message);
    this.name = 'FetcherError';
    this.info = options?.info;
    this.status = options?.status;
  }
}

async function fetcher(url: string) {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new FetcherError('An error occurred while fetching the data.', {
      info: await response.json(),
      status: response.status,
    });
  }
  return response.json();
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  plan: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  aiCostLimitCents: number;
  aiCostUsedCents: number;
  monthlyGenerations: number;
  maxMonthlyGenerations: number;
  maxProducts: number;
  trialEndsAt?: string | null;
  planExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    products: number;
    designs: number;
    orders: number;
  };
}

export interface UseBrandsOptions {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BrandsResponse {
  brands: Brand[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useBrands(options: UseBrandsOptions = {}) {
  const [filters, setFilters] = useState<UseBrandsOptions>({
    page: 1,
    limit: 20,
    ...options,
  });

  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, String(value));
    }
  });

  const { data, error, isLoading, mutate } = useSWR<BrandsResponse>(
    `/api/admin/brands?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000,
    }
  );

  const updateFilters = useCallback((newFilters: Partial<UseBrandsOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  return {
    brands: normalizeListResponse<Brand>((data as Record<string, unknown> | undefined)?.brands ?? (data as Record<string, unknown> | undefined)?.data),
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    isLoading,
    isError: !!error,
    error,
    filters,
    updateFilters,
    goToPage,
    refresh: mutate,
  };
}
