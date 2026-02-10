/**
 * USE ORION OVERVIEW HOOK
 * Hook SWR for ORION Command Center data (agents, metrics)
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

export interface OrionAgent {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  status: string;
  config?: Record<string, unknown> | null;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrionOverview {
  agents: OrionAgent[];
  metrics: {
    totalCustomers: number;
    activeCustomers: number;
    atRiskCustomers: number;
    agentsActive: number;
    agentsTotal: number;
  };
}

export function useOrionOverview() {
  const { data, error, isLoading, mutate } = useSWR<OrionOverview>(
    '/api/admin/orion/overview',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: data || null,
    agents: data?.agents || [],
    metrics: data?.metrics || null,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
