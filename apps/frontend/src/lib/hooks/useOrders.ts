import { useState, useEffect, useCallback } from 'react';
import type { OrderSummary } from '@/lib/types';
import type { OrderItem, ShippingAddress, BillingAddress } from '@/lib/types/order';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

type Order = OrderSummary;

/**
 * Hook to get all orders with pagination
 */
export function useOrders(params?: { 
  page?: number; 
  limit?: number; 
  status?: string;
  search?: string;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await endpoints.orders.list({
        page: params?.page,
        limit: params?.limit,
        status: params?.status,
        search: params?.search,
      });

      // Handle different response formats
      const raw = result as { data?: { orders?: Order[]; pagination?: typeof pagination }; orders?: Order[]; pagination?: typeof pagination };
      const ordersList = raw?.data?.orders ?? raw?.orders ?? [];
      const pag = raw?.data?.pagination ?? raw?.pagination ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      setOrders(Array.isArray(ordersList) ? ordersList : []);
      setPagination(pag);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur chargement orders', {
        error: err,
        params,
        message,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.limit, params?.status, params?.search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    pagination,
    loading,
    error,
    refresh: loadOrders
  };
}

/**
 * Hook to get single order by ID
 */
export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await endpoints.orders.get(id);
      const raw = result as { data?: { order?: Order }; order?: Order };
      const orderData = raw?.data?.order ?? raw?.order ?? result;
      setOrder(orderData as Order);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur chargement order', {
        error: err,
        orderId: id,
        message,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  return {
    order,
    loading,
    error,
    refresh: loadOrder
  };
}

/**
 * Hook to create order
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (data: {
    items: OrderItem[] | Array<Record<string, unknown>>;
    shipping_address: ShippingAddress;
    billing_address?: BillingAddress;
    payment_method?: string;
    customer_notes?: string;
    shipping_method?: string;
    discount_code?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const result = await endpoints.orders.create(data);
      const raw = result as { data?: { order?: Order }; order?: Order };
      return raw?.data?.order ?? raw?.order ?? result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur création order', {
        error: err,
        orderData: data,
        message,
      });
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    loading,
    error
  };
}

/**
 * Hook to update order
 */
export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrder = async (id: string, data: {
    status?: string;
    tracking_number?: string;
    shipping_method?: string;
    notes?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const result = await endpoints.orders.update(id, data);
      const raw = result as { data?: { order?: Order }; order?: Order };
      return raw?.data?.order ?? raw?.order ?? result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur mise à jour order', {
        error: err,
        orderId: id,
        updateData: data,
        message,
      });
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await endpoints.orders.cancel(id);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur annulation order', {
        error: err,
        orderId: id,
        message,
      });
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateOrder,
    cancelOrder,
    loading,
    error
  };
}



