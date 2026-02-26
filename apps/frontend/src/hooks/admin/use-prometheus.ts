'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api/client';

const fetchStats = async () => {
  const res = await endpoints.orion.prometheus.stats();
  const raw = (res as { data?: unknown })?.data ?? res;
  const stats = (raw ?? {}) as {
    ticketsOpen?: number;
    queue?: { total?: number; pending?: number; approved?: number; rejected?: number };
  };
  const queue = stats.queue ?? {};
  const total = Number(queue.total ?? 0);
  const approved = Number(queue.approved ?? 0);
  const pending = Number(queue.pending ?? 0);
  const rejected = Number(queue.rejected ?? 0);
  return {
    totalResponses: total,
    pendingReview: pending,
    autoApproved: approved,
    rejected,
    approvalRate: total > 0 ? approved / total : 0,
    avgConfidence: null,
    avgLatencyMs: null,
    ticketsOpen: Number(stats.ticketsOpen ?? 0),
    providers: [],
  };
};

export function usePrometheus() {
  const { data, error, isLoading, mutate } = useSWR(
    'orion-prometheus-stats',
    fetchStats,
    { refreshInterval: 30000 },
  );

  const analyzeTicket = async (ticketId: string) => {
    const res = await endpoints.orion.prometheus.analyzeTicket(ticketId);
    return (res as { data?: unknown })?.data ?? res;
  };

  const generateResponse = async (ticketId: string) => {
    const res = await endpoints.orion.prometheus.generateResponse(ticketId);
    return (res as { data?: unknown })?.data ?? res;
  };

  return {
    stats: data,
    isLoading,
    error,
    analyzeTicket,
    generateResponse,
    refresh: mutate,
  };
}
