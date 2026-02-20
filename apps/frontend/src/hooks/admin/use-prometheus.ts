'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api/client';

const fetchStats = async () => {
  const res = await endpoints.orion.prometheus.stats();
  return res.data;
};

export function usePrometheus() {
  const { data, error, isLoading, mutate } = useSWR(
    'orion-prometheus-stats',
    fetchStats,
    { refreshInterval: 30000 },
  );

  const analyzeTicket = async (ticketId: string) => {
    const res = await endpoints.orion.prometheus.analyzeTicket(ticketId);
    return res.data;
  };

  const generateResponse = async (ticketId: string) => {
    const res = await endpoints.orion.prometheus.generateResponse(ticketId);
    return res.data;
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
