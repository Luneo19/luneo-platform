'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api/client';

const fetchReviewQueue = async (params?: any) => {
  const res = await endpoints.orion.prometheus.reviewQueue(params);
  return res.data;
};

const fetchReviewStats = async () => {
  const res = await endpoints.orion.prometheus.reviewStats();
  return res.data;
};

export function useReviewQueue(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    ['orion-review-queue', params],
    () => fetchReviewQueue(params),
    { refreshInterval: 15000, revalidateOnFocus: true },
  );

  const { data: stats, mutate: refreshStats } = useSWR(
    'orion-review-stats',
    fetchReviewStats,
    { refreshInterval: 15000 },
  );

  const approveResponse = async (responseId: string, body?: { notes?: string; editedContent?: string }) => {
    await endpoints.orion.prometheus.approveResponse(responseId, body);
    mutate();
    refreshStats();
  };

  const rejectResponse = async (responseId: string, body?: { notes?: string }) => {
    await endpoints.orion.prometheus.rejectResponse(responseId, body);
    mutate();
    refreshStats();
  };

  const bulkApprove = async (responseIds: string[]) => {
    await endpoints.orion.prometheus.bulkApprove(responseIds);
    mutate();
    refreshStats();
  };

  return {
    queue: data,
    stats,
    isLoading,
    error,
    approveResponse,
    rejectResponse,
    bulkApprove,
    refresh: () => { mutate(); refreshStats(); },
  };
}
