/**
 * USE ORION DASHBOARD HOOK
 * Aggregates data from overview, revenue, retention, and agents endpoints via SWR.
 */
import useSWR from 'swr';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

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
  const response = await fetchWithTimeout(url, {
    credentials: 'include',
    timeout: 10000,
  });
  if (!response.ok) {
    const info = await response.json().catch(() => ({}));
    throw new FetcherError('An error occurred while fetching the data.', {
      info,
      status: response.status,
    });
  }
  const data = await response.json();
  return data ?? null;
}

/** For endpoints that may 404; returns null on 404 instead of throwing. */
async function fetcherOptional(url: string): Promise<unknown> {
  const response = await fetchWithTimeout(url, {
    credentials: 'include',
    timeout: 10000,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const info = await response.json().catch(() => ({}));
    throw new FetcherError('An error occurred while fetching the data.', {
      info,
      status: response.status,
    });
  }
  const data = await response.json();
  return data ?? null;
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

interface OrionOverviewRaw {
  kpis?: {
    users?: number;
    organizations?: number;
    [key: string]: unknown;
  };
  retention?: {
    atRiskCount?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
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

// --- Metrics KPIs (from /api/admin/orion/metrics/kpis)
export interface OrionKPIs {
  cac: { value: number | null; totalSpend: number; newCustomers: number };
  nps: { value: number | null; totalResponses: number; promoters: number; detractors: number };
  trialConversion: { rate: number | null; totalTrial: number; converted: number; avgDays: number | null };
}

const OVERVIEW_KEY = '/api/admin/orion/overview';
const REVENUE_KEY = '/api/admin/orion/revenue';
const RETENTION_KEY = '/api/admin/orion/retention';
const AGENTS_KEY = '/api/admin/orion/agents';
const KPIS_KEY = '/api/admin/orion/metrics/kpis';

const swrConfig = {
  refreshInterval: 30000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeOverview(raw: OrionOverviewRaw | null | undefined, agents: OrionAgentsList | null): OrionOverview {
  const kpis = raw?.kpis;
  const retention = raw?.retention;
  const safeAgents = Array.isArray(agents) ? agents : [];
  return {
    agents: safeAgents,
    metrics: {
      totalCustomers: asNumber(kpis?.users),
      activeCustomers: asNumber(kpis?.users),
      atRiskCustomers: asNumber(retention?.atRiskCount),
      agentsActive: safeAgents.filter((agent) => String(agent.status).toUpperCase() === 'ACTIVE').length,
      agentsTotal: safeAgents.length,
    },
  };
}

export interface OrionDashboardData {
  overview: OrionOverview | null;
  revenue: OrionRevenue | null;
  retention: OrionRetention | null;
  agents: OrionAgentsList | null;
  kpis: OrionKPIs | null;
}

export interface UseOrionDashboardReturn {
  data: OrionDashboardData;
  overview: OrionOverview | null;
  revenue: OrionRevenue | null;
  retention: OrionRetention | null;
  agents: OrionAgentsList | null;
  kpis: OrionKPIs | null;
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
  const { data: overviewData, error: overviewError, isLoading: isLoadingOverview, mutate: mutateOverview } = useSWR<OrionOverviewRaw>(
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

  const { data: kpisRaw, mutate: mutateKpis } = useSWR<{ success: boolean; data: OrionKPIs } | null>(
    KPIS_KEY,
    fetcherOptional as (url: string) => Promise<{ success: boolean; data: OrionKPIs } | null>,
    swrConfig
  );

  const refresh = () => {
    void mutateOverview();
    void mutateRevenue();
    void mutateRetention();
    void mutateAgents();
    void mutateKpis();
  };

  const overview = normalizeOverview(overviewData, agentsData ?? null);
  const revenue = revenueData ?? null;
  const retention = retentionData ?? null;
  const agents = agentsData ?? null;
  const kpis = kpisRaw?.data ?? null;

  const data: OrionDashboardData = {
    overview,
    revenue,
    retention,
    agents,
    kpis,
  };

  const isLoading =
    isLoadingOverview || isLoadingRevenue || isLoadingRetention || isLoadingAgents;

  return {
    data,
    overview,
    revenue,
    retention,
    agents,
    kpis,
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
