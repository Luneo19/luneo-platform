import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

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
  shipping_address?: any;
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

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const result = await response.json() as OrdersResponse;

      if (!response.ok) {
        throw new Error(result.data?.toString() || 'Erreur lors du chargement des commandes');
      }

      const { orders: fetchedOrders, pagination } = result.data;

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

