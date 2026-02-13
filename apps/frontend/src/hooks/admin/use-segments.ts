/**
 * USE SEGMENTS HOOK
 * Hook SWR for customer segments (CRUD)
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
  return response.json();
}

export interface Segment {
  id: string;
  name: string;
  description?: string | null;
  criteria: Record<string, unknown>;
  userCount: number;
  isActive: boolean;
  type?: string | null;
  brandId?: string | null;
  brand?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export function useSegments() {
  const { data, error, isLoading, mutate } = useSWR<Segment[]>(
    '/api/admin/orion/segments',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const createSegment = async (segment: { name: string; description?: string; conditions: unknown[]; type?: string }) => {
    const res = await fetch('/api/admin/orion/segments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(segment),
    });
    if (!res.ok) throw new Error('Failed to create segment');
    await mutate();
    return res.json();
  };

  const deleteSegment = async (id: string) => {
    const res = await fetch(`/api/admin/orion/segments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete segment');
    await mutate();
  };

  return {
    segments: data || [],
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    createSegment,
    deleteSegment,
  };
}
