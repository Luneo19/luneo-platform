'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api/client';

export type ReviewQueueParams = Parameters<typeof endpoints.orion.prometheus.reviewQueue>[0];

const fetchReviewQueue = async (params?: ReviewQueueParams) => {
  const res = await endpoints.orion.prometheus.reviewQueue(params);
  return (res as { data?: unknown })?.data ?? res;
};

const fetchReviewStats = async () => {
  const res = await endpoints.orion.prometheus.reviewStats();
  return (res as { data?: unknown })?.data ?? res;
};

export function useReviewQueue(params?: ReviewQueueParams) {
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
