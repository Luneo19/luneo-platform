/**
 * USE BILLING OVERVIEW HOOK
 * Hook SWR for billing/subscription overview metrics
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

export interface BillingOverview {
  mrr: number;
  arr: number;
  totalRevenue: number;
  subscribersByPlan: Record<string, number>;
  revenueByPlan: Record<string, number>;
  churnRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  recentInvoices: Array<{
    id: string;
    brandName: string;
    amount: number;
    currency: string;
    status: string;
    paidAt?: string | null;
    createdAt: string;
  }>;
}

export function useBillingOverview() {
  const { data, error, isLoading, mutate } = useSWR<BillingOverview>(
    '/api/admin/billing/overview',
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: data || null,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
