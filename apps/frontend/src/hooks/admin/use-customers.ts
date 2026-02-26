/**
 * ★★★ USE CUSTOMERS HOOK ★★★
 * Hook SWR pour récupérer la liste des customers avec filtres et pagination
 *
 * Coexistence: This admin area uses SWR for simple GET + cache; the rest of the app
 * uses React Query (@tanstack/react-query). Both can coexist. Consider migrating to
 * React Query later for consistency if desired.
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { normalizeListResponse } from '@/lib/api/normalize';

export interface UseCustomersOptions {
  page?: number;
  limit?: number;
  status?: string; // active, trial, churned, at-risk
  plan?: string;
  segment?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  plan: string | null;
  planPrice: number;
  status: 'active' | 'trial' | 'churned' | 'at-risk' | 'none';
  ltv: number;
  engagementScore: number;
  churnRisk: 'low' | 'medium' | 'high';
  totalTimeSpent: number;
  totalSessions: number;
  lastSeenAt: Date | string;
  segments: Array<{ id: string; name: string }>;
  createdAt: Date | string;
  customerSince: Date | string;
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Error thrown by fetcher with API response details */
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
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new FetcherError('An error occurred while fetching the data.', {
      info: await response.json(),
      status: response.status,
    });
  }

  return response.json();
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const [filters, setFilters] = useState<UseCustomersOptions>({
    page: 1,
    limit: 50,
    ...options,
  });

  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, String(value));
    }
  });

  const { data, error, isLoading, mutate } = useSWR<CustomersResponse>(
    `/api/admin/customers?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const updateFilters = useCallback((newFilters: Partial<UseCustomersOptions>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  return {
    customers: normalizeListResponse<Customer>((data as Record<string, unknown> | undefined)?.customers ?? (data as Record<string, unknown> | undefined)?.data),
    pagination: data?.pagination || {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    },
    isLoading,
    isError: !!error,
    error,
    filters,
    updateFilters,
    goToPage,
    refresh: mutate,
  };
}
