import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

interface OrderItem {
  id: string;
  product_name: string;
  design_name?: string;
  design_preview_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  production_status?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_amount: number;
  currency: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
  payment_method?: string;
  shipping_method?: string;
  shipping_address?: Record<string, unknown>;
  items?: OrderItem[];
}

interface OrdersResponse {
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export function useOrdersData(
  page: number = 1,
  limit: number = 20,
  statusFilter: string = 'all',
  searchTerm: string = ''
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const loadOrders = useCallback(async (isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await endpoints.orders.list({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      const ordersData = (result as OrdersResponse)?.data ?? result as { orders?: Order[]; pagination?: { hasNext: boolean; total: number } };
      const fetchedOrders = ordersData?.orders ?? [];
      const pagination = ordersData?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false };

      if (isLoadMore) {
        setOrders((prev) => [...prev, ...fetchedOrders]);
      } else {
        setOrders(fetchedOrders);
      }

      setHasMore(pagination.hasNext);
      setTotal(pagination.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement orders', {
        error: err,
        page,
        statusFilter,
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, limit, statusFilter, searchTerm]);

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  return {
    orders,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    refresh: () => loadOrders(false),
    loadMore: () => loadOrders(true),
  };
}

