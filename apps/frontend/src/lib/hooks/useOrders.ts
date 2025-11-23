import { useState, useEffect, useCallback } from 'react';
import type { OrderSummary } from '@luneo/types';
import { logger } from '@/lib/logger';
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

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.status) queryParams.set('status', params.status);
      if (params?.search) queryParams.set('search', params.search);

      const response = await fetch(`/api/orders?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des commandes');
      }

      setOrders(result.data.orders);
      setPagination(result.data.pagination);
    } catch (err: any) {
      logger.error('Erreur chargement orders', {
        error: err,
        params,
        message: err.message,
      });
      setError(err.message);
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

      const response = await fetch(`/api/orders/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du chargement de la commande');
      }

      setOrder(result.data.order);
    } catch (err: any) {
      logger.error('Erreur chargement order', {
        error: err,
        orderId: id,
        message: err.message,
      });
      setError(err.message);
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
    items: any[];
    shipping_address: any;
    billing_address?: any;
    payment_method?: string;
    customer_notes?: string;
    shipping_method?: string;
    discount_code?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création de la commande');
      }

      return result.data.order;
    } catch (err: any) {
      logger.error('Erreur création order', {
        error: err,
        orderData: data,
        message: err.message,
      });
      setError(err.message);
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

      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      return result.data.order;
    } catch (err: any) {
      logger.error('Erreur mise à jour order', {
        error: err,
        orderId: id,
        updateData: data,
        message: err.message,
      });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'annulation');
      }

      return result;
    } catch (err: any) {
      logger.error('Erreur annulation order', {
        error: err,
        orderId: id,
        message: err.message,
      });
      setError(err.message);
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



