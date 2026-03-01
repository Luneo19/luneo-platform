'use client';

import useSWR from 'swr';
import { endpoints } from '@/lib/api/client';

export type ReviewQueueParams = Parameters<typeof endpoints.orion.prometheus.reviewQueue>[0];

const fetchReviewQueue = async (params?: ReviewQueueParams) => {
  const normalizedParams = {
    ...params,
    status: typeof params?.status === 'string' ? params.status.toLowerCase() : params?.status,
  };
  const res = await endpoints.orion.prometheus.reviewQueue(normalizedParams);
  const raw = ((res as { data?: unknown })?.data ?? res) as {
    items?: Array<Record<string, unknown>>;
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: items.map((item) => ({
      id: String(item.id ?? ''),
      ticketId: String(item.ticketId ?? ''),
      generatedContent: String(item.generatedContent ?? item.generatedResponse ?? ''),
      confidenceScore: typeof item.confidenceScore === 'number' ? item.confidenceScore : 0.5,
      status: String(item.status ?? 'pending').toUpperCase(),
      createdAt: String(item.createdAt ?? new Date().toISOString()),
      ticket: {
        ticketNumber: String(item.ticketNumber ?? item.ticketId ?? ''),
        subject: String(item.ticketSubject ?? item.subject ?? ''),
      },
    })),
    total: Number(raw?.total ?? items.length),
    page: Number(raw?.page ?? 1),
    totalPages: Number(raw?.totalPages ?? 1),
  };
};

const fetchReviewStats = async () => {
  const res = await endpoints.orion.prometheus.reviewStats();
  const raw = ((res as { data?: unknown })?.data ?? res) as {
    queue?: { total?: number; pending?: number; approved?: number; rejected?: number };
  };
  const queue = raw?.queue ?? {};
  const total = Number(queue.total ?? 0);
  const approved = Number(queue.approved ?? 0);
  const rejected = Number(queue.rejected ?? 0);
  const pending = Number(queue.pending ?? 0);
  return {
    pending,
    approvedToday: approved,
    rejectedToday: rejected,
    avgConfidence: 0,
    approvalRate: total > 0 ? approved / total : 0,
  };
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
