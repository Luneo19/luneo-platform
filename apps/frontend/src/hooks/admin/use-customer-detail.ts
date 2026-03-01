/**
 * ★★★ USE CUSTOMER DETAIL HOOK ★★★
 * Hook SWR pour récupérer les détails d'un customer
 *
 * Coexistence: This admin area uses SWR for simple GET + cache; the rest of the app
 * uses React Query (@tanstack/react-query). Both can coexist. Consider migrating to
 * React Query later for consistency if desired.
 */

import useSWR from 'swr';

export interface CustomerDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  plan: string | null;
  planPrice: number;
  status: 'active' | 'trial' | 'churned' | 'at-risk' | 'none';
  ltv: number;
  predictedLtv: number;
  engagementScore: number;
  churnRisk: 'low' | 'medium' | 'high';
  totalRevenue: number;
  avgMonthlyRevenue: number;
  monthsActive: number;
  totalTimeSpent: number;
  totalSessions: number;
  lastSeenAt: Date | string;
  firstSeenAt: Date | string;
  segments: Array<{ id: string; name: string }>;
  createdAt: Date | string;
  customerSince: Date | string;
  company?: string | null;
  industry?: string | null;
  country?: string | null;
  timezone?: string | null;
  isActive?: boolean;
}

export interface CustomerActivity {
  id: string;
  type: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: Date | string;
}

export interface CustomerDetailResponse {
  customer: CustomerDetail;
  activities: CustomerActivity[];
  billingHistory: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date | string;
  }>;
  emailHistory: Array<{
    id: string;
    subject: string;
    status: string;
    sentAt: Date | string;
  }>;
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

export function useCustomerDetail(customerId: string) {
  const { data, error, isLoading, mutate } = useSWR<CustomerDetailResponse>(
    customerId ? `/api/admin/customers/${customerId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const payload = (data ?? {}) as Partial<CustomerDetailResponse> & Record<string, unknown>;
  const resolvedCustomer =
    payload.customer && typeof payload.customer === 'object'
      ? (payload.customer as CustomerDetail)
      : (payload as unknown as CustomerDetail);
  const normalizedCustomer = resolvedCustomer && typeof resolvedCustomer === 'object'
    ? ({
        ...resolvedCustomer,
        segments: Array.isArray((resolvedCustomer as { segments?: unknown }).segments)
          ? ((resolvedCustomer as { segments: CustomerDetail['segments'] }).segments)
          : [],
      } as CustomerDetail)
    : resolvedCustomer;
  const hasValidCustomer = normalizedCustomer && typeof normalizedCustomer.id === 'string' && normalizedCustomer.id.length > 0;

  return {
    customer: hasValidCustomer ? normalizedCustomer : undefined,
    activities: Array.isArray(payload.activities) ? payload.activities : [],
    billingHistory: Array.isArray(payload.billingHistory) ? payload.billingHistory : [],
    emailHistory: Array.isArray(payload.emailHistory) ? payload.emailHistory : [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
