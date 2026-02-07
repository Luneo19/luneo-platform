import { useCallback } from 'react';
import { useInfinitePagination } from './useInfiniteScroll';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: unknown[];
}

// Map backend order to hook shape
function mapOrder(o: Record<string, unknown>): Order {
  return {
    id: (o.id as string) ?? '',
    order_number: ((o as any).orderNumber ?? (o as any).order_number) as string,
    customer_email: ((o as any).customerEmail ?? (o as any).customer_email) as string,
    total_amount: Number((o as any).totalAmount ?? (o as any).total_amount ?? 0),
    currency: ((o as any).currency as string) ?? 'EUR',
    status: (o.status as string) ?? 'pending',
    payment_status: ((o as any).paymentStatus ?? (o as any).payment_status) as string,
    created_at: (o.createdAt ?? (o as any).created_at) as string,
    order_items: ((o as any).orderItems ?? (o as any).order_items) ?? [],
  };
}

/**
 * Hook pour charger les commandes avec infinite scroll via le backend NestJS
 */
export function useOrdersInfinite(filters?: { status?: string; search?: string }) {
  const fetchOrders = useCallback(
    async (page: number, limit: number) => {
      try {
        const res = await endpoints.orders.list({
          page,
          limit,
          status: filters?.status,
          search: filters?.search,
        });
        const raw = res as { orders?: unknown[]; data?: unknown[]; pagination?: { hasNext?: boolean; total?: number } };
        const list = raw.orders ?? raw.data ?? (Array.isArray(res) ? res : []);
        const pagination = raw.pagination;
        const total = pagination?.total ?? (list as unknown[]).length;
        const hasMore = pagination?.hasNext ?? (page * limit < total);
        const data = (list as Record<string, unknown>[]).map(mapOrder);
        return { data, hasMore };
      } catch (err: unknown) {
        logger.error('Error fetching orders', {
          error: err,
          page,
          limit,
          filters,
          message: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    [filters?.status, filters?.search]
  );

  return useInfinitePagination<Order>(fetchOrders, 20);
}
