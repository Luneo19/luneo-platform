'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api/client';

const fetchStats = async () => {
  const res = await endpoints.orion.prometheus.stats();
  return (res as { data?: unknown })?.data ?? res;
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
