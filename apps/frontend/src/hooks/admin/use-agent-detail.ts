'use client';

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
    throw new FetcherError('Failed to fetch', { info: await response.json(), status: response.status });
  }
  return response.json();
}

export interface AgentDetail {
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

type AgentsResponse = AgentDetail[] | { data?: AgentDetail[]; agents?: AgentDetail[]; items?: AgentDetail[] };

function normalizeAgents(data: AgentsResponse | undefined): AgentDetail[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const fromData = (data as { data?: unknown }).data;
  if (Array.isArray(fromData)) return fromData as AgentDetail[];
  const fromAgents = (data as { agents?: unknown }).agents;
  if (Array.isArray(fromAgents)) return fromAgents as AgentDetail[];
  const fromItems = (data as { items?: unknown }).items;
  if (Array.isArray(fromItems)) return fromItems as AgentDetail[];
  return [];
}

export function useAgentDetail(agentType: string) {
  const { data: raw, error: agentsError, isLoading: agentsLoading, mutate } = useSWR<AgentsResponse>(
    '/api/admin/orion/agents',
    fetcher,
    { revalidateOnFocus: true }
  );

  const agents = normalizeAgents(raw);
  const normalizedType = agentType.toLowerCase();
  const agent = agents.find((a) => {
    const byType = String(a.type ?? '').toLowerCase() === normalizedType;
    const byName = String(a.name ?? '').toLowerCase() === normalizedType;
    return byType || byName;
  }) ?? null;

  return { agent, agents, isLoading: agentsLoading, error: agentsError, refresh: mutate };
}

export function useAgentDomainData<T>(url: string | null) {
  const { data, error, isLoading } = useSWR<T>(url, fetcher, { revalidateOnFocus: true });
  return { data: data ?? null, isLoading, error };
}
