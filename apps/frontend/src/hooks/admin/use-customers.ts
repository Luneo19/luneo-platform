/**
 * ★★★ USE CUSTOMERS HOOK ★★★
 * Hook SWR pour récupérer la liste des customers avec filtres et pagination
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';

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

async function fetcher(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // @ts-ignore
    error.info = await response.json();
    // @ts-ignore
    error.status = response.status;
    throw error;
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
    customers: data?.customers || [],
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
