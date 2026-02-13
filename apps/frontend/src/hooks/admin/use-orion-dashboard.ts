/**
 * USE ORION DASHBOARD HOOK
 * Aggregates data from overview, revenue, retention, and agents endpoints via SWR.
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
    const info = await response.json().catch(() => ({}));
    throw new FetcherError('An error occurred while fetching the data.', {
      info,
      status: response.status,
    });
  }
  return response.json();
}

/** For endpoints that may 404; returns null on 404 instead of throwing. */
async function fetcherOptional(url: string): Promise<unknown> {
  const response = await fetch(url, { credentials: 'include' });
  if (response.status === 404) return null;
  if (!response.ok) {
    const info = await response.json().catch(() => ({}));
    throw new FetcherError('An error occurred while fetching the data.', {
      info,
      status: response.status,
    });
  }
  return response.json();
}

// --- Overview (from /api/admin/orion/overview)
export interface OrionAgent {
  id: string;
  name: string;
  type?: string | null;
  displayName?: string | null;
  description?: string | null;
  status: string;
  config?: Record<string, unknown> | null;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrionOverviewMetrics {
  totalCustomers: number;
  activeCustomers: number;
  atRiskCustomers: number;
  agentsActive: number;
  agentsTotal: number;
}

export interface OrionOverview {
  agents: OrionAgent[];
  metrics: OrionOverviewMetrics;
}

// --- Revenue (from /api/admin/orion/revenue) — may 404
export interface OrionRevenue {
  mrr: number;
  arr: number;
  growthRate: number;
  churnRevenue: number;
  expansionRevenue: number;
}

// --- Retention (from /api/admin/orion/retention) — may 404
export interface OrionRetentionDistribution {
  level: string;
  count: number;
}

export interface OrionRetentionTrendDay {
  date: string;
  count: number;
  avgScore: number;
}

export interface OrionRetention {
  totalUsers: number;
  avgHealthScore: number;
  atRiskCount: number;
  atRiskPercent: number;
  distribution: OrionRetentionDistribution[];
  trend: OrionRetentionTrendDay[];
}

// --- Agents list (from /api/admin/orion/agents) — may 404, same shape as overview agents
export type OrionAgentsList = OrionAgent[];

const OVERVIEW_KEY = '/api/admin/orion/overview';
const REVENUE_KEY = '/api/admin/orion/revenue';
const RETENTION_KEY = '/api/admin/orion/retention';
const AGENTS_KEY = '/api/admin/orion/agents';

const swrConfig = {
  refreshInterval: 30000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

export interface OrionDashboardData {
  overview: OrionOverview | null;
  revenue: OrionRevenue | null;
  retention: OrionRetention | null;
  agents: OrionAgentsList | null;
}

export interface UseOrionDashboardReturn {
  data: OrionDashboardData;
  overview: OrionOverview | null;
  revenue: OrionRevenue | null;
  retention: OrionRetention | null;
  agents: OrionAgentsList | null;
  isLoadingOverview: boolean;
  isLoadingRevenue: boolean;
  isLoadingRetention: boolean;
  isLoadingAgents: boolean;
  isLoading: boolean;
  isOverviewError: boolean;
  isRevenueError: boolean;
  isRetentionError: boolean;
  isAgentsError: boolean;
  overviewError: unknown;
  revenueError: unknown;
  retentionError: unknown;
  agentsError: unknown;
  refresh: () => void;
}

function useOrionDashboard(): UseOrionDashboardReturn {
  const { data: overviewData, error: overviewError, isLoading: isLoadingOverview, mutate: mutateOverview } = useSWR<OrionOverview>(
    OVERVIEW_KEY,
    fetcher,
    swrConfig
  );

  const { data: revenueData, error: revenueError, isLoading: isLoadingRevenue, mutate: mutateRevenue } = useSWR<OrionRevenue | null>(
    REVENUE_KEY,
    fetcherOptional as (url: string) => Promise<OrionRevenue | null>,
    swrConfig
  );

  const { data: retentionData, error: retentionError, isLoading: isLoadingRetention, mutate: mutateRetention } = useSWR<OrionRetention | null>(
    RETENTION_KEY,
    fetcherOptional as (url: string) => Promise<OrionRetention | null>,
    swrConfig
  );

  const { data: agentsData, error: agentsError, isLoading: isLoadingAgents, mutate: mutateAgents } = useSWR<OrionAgentsList | null>(
    AGENTS_KEY,
    fetcherOptional as (url: string) => Promise<OrionAgentsList | null>,
    swrConfig
  );

  const refresh = () => {
    void mutateOverview();
    void mutateRevenue();
    void mutateRetention();
    void mutateAgents();
  };

  const overview = overviewData ?? null;
  const revenue = revenueData ?? null;
  const retention = retentionData ?? null;
  const agents = agentsData ?? null;

  const data: OrionDashboardData = {
    overview,
    revenue,
    retention,
    agents,
  };

  const isLoading =
    isLoadingOverview || isLoadingRevenue || isLoadingRetention || isLoadingAgents;

  return {
    data,
    overview,
    revenue,
    retention,
    agents,
    isLoadingOverview,
    isLoadingRevenue,
    isLoadingRetention,
    isLoadingAgents,
    isLoading,
    isOverviewError: !!overviewError,
    isRevenueError: !!revenueError,
    isRetentionError: !!retentionError,
    isAgentsError: !!agentsError,
    overviewError,
    revenueError,
    retentionError,
    agentsError,
    refresh,
  };
}

export { useOrionDashboard };
