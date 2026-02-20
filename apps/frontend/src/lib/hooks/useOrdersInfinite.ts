'use client';

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
    order_number: (String(o.orderNumber ?? o.order_number ?? '')),
    customer_email: (String(o.customerEmail ?? o.customer_email ?? '')),
    total_amount: Number(o.totalAmount ?? o.total_amount ?? 0),
    currency: (o.currency as string) ?? 'EUR',
    status: (o.status as string) ?? 'pending',
    payment_status: (String(o.paymentStatus ?? o.payment_status ?? '')),
    created_at: (String(o.createdAt ?? o.created_at ?? '')),
    order_items: (Array.isArray(o.orderItems) ? o.orderItems : Array.isArray(o.order_items) ? o.order_items : []) as unknown[],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters?.status, filters?.search]
  );

  return useInfinitePagination<Order>(fetchOrders, 20);
}
