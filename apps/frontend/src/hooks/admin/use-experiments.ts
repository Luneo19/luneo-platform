/**
 * USE EXPERIMENTS HOOK
 * Hook SWR for A/B testing experiments (CRUD)
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

async function fetcher(url: string): Promise<Experiment[]> {
  const response = await fetch(url, { credentials: 'include' });
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    let info: unknown;
    try {
      info = await response.json();
    } catch {
      info = null;
    }
    throw new FetcherError('An error occurred while fetching the data.', {
      info,
      status: response.status,
    });
  }
  const data: unknown = await response.json();
  return (Array.isArray(data) ? data : (data as { data?: Experiment[] })?.data ?? []) as Experiment[];
}

export interface Experiment {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  variants: Record<string, unknown>[];
  targetAudience?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assignments: number;
  };
}

export function useExperiments() {
  const { data, error, isLoading, mutate } = useSWR<Experiment[]>(
    '/api/admin/orion/experiments',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const createExperiment = async (experiment: { name: string; description?: string; type: string; variants: Record<string, unknown>[] }) => {
    const res = await fetch('/api/admin/orion/experiments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(experiment),
    });
    if (!res.ok) throw new Error('Failed to create experiment');
    await mutate();
    return res.json();
  };

  return {
    experiments: data || [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    createExperiment,
  };
}
