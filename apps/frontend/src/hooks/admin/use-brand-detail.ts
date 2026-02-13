/**
 * USE BRAND DETAIL HOOK
 * Hook SWR for single brand detail with full relations
 */
import useSWR from 'swr';

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

export interface BrandDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  industry?: string | null;
  status: string;
  plan: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  aiCostLimitCents: number;
  aiCostUsedCents: number;
  monthlyGenerations: number;
  maxMonthlyGenerations: number;
  maxProducts: number;
  trialEndsAt?: string | null;
  planExpiresAt?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  users: Array<{ id: string; email: string; firstName?: string | null; lastName?: string | null; role: string; lastLoginAt?: string | null }>;
  _count: {
    users: number;
    products: number;
    designs: number;
    orders: number;
    invoices: number;
  };
}

export function useBrandDetail(brandId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<BrandDetail>(
    brandId ? `/api/admin/brands/${brandId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    brand: data || null,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
