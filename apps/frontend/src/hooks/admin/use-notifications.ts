/**
 * USE NOTIFICATIONS HOOK
 * Hook SWR for admin notifications with mark-as-read
 */
import useSWR from 'swr';
import { normalizeListResponse } from '@/lib/api/normalize';

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
    if (url.includes('/count')) return { count: 0 };
    return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
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

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  items: AdminNotification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useAdminNotifications(options: { page?: number; pageSize?: number; type?: string; read?: boolean } = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.set(key, String(value));
    }
  });

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    `/api/admin/orion/notifications?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  // Unread count
  const { data: countData } = useSWR<{ count: number }>(
    '/api/admin/orion/notifications/count',
    fetcher,
    { refreshInterval: 15000 }
  );

  const markAsRead = async (id: string) => {
    await fetch(`/api/admin/orion/notifications/${id}/read`, {
      method: 'PUT',
      credentials: 'include',
    });
    await mutate();
  };

  const markAllAsRead = async () => {
    await fetch('/api/admin/orion/notifications/read-all', {
      method: 'PUT',
      credentials: 'include',
    });
    await mutate();
  };

  return {
    notifications: normalizeListResponse<AdminNotification>((data as Record<string, unknown> | undefined)?.items),
    pagination: data ? { page: data.page, pageSize: data.pageSize, total: data.total, totalPages: data.totalPages } : null,
    unreadCount: typeof countData?.count === 'number' ? countData.count : 0,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
    markAsRead,
    markAllAsRead,
  };
}
