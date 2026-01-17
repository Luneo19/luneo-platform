/**
 * ★★★ HOOK - ORDERS (React Query) ★★★
 * Hooks React Query pour gérer les commandes
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface OrdersListResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Hook pour lister les commandes
 */
export function useOrders(
  params: OrdersListParams = {},
  options?: Omit<UseQueryOptions<OrdersListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<OrdersListResponse>({
    queryKey: ['orders', 'list', params],
    queryFn: async () => {
      try {
        const response = await endpoints.orders.list(params);
        
        // Si la réponse est un array, wrapper dans un objet paginé
        if (Array.isArray(response)) {
          return {
            data: response,
            pagination: {
              page: params.page || 1,
              limit: params.limit || 20,
              total: response.length,
              pages: 1,
            },
          };
        }
        
        return response as OrdersListResponse;
      } catch (error) {
        logger.error('Failed to fetch orders', { error, params });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (plus frais que designs)
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour récupérer une commande spécifique
 */
export function useOrder(
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Order>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Order>({
    queryKey: ['orders', 'detail', id],
    queryFn: async (): Promise<Order> => {
      if (!id) throw new Error('Order ID is required');
      
      try {
        const result = await endpoints.orders.get(id) as unknown;
        return result as Order;
      } catch (error) {
        logger.error('Failed to fetch order', { error, id });
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour créer une commande
 */
export function useCreateOrder(
  options?: UseMutationOptions<Order, Error, any>
) {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, any>({
    mutationFn: async (data): Promise<Order> => {
      try {
        const result = await endpoints.orders.create(data) as unknown;
        return result as Order;
      } catch (error) {
        logger.error('Failed to create order', { error, data });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.setQueryData(['orders', 'detail', data.id], data);
      // Invalider aussi le dashboard car les revenus peuvent changer
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    ...options,
  });
}

/**
 * Hook pour mettre à jour une commande
 */
export function useUpdateOrder(
  options?: UseMutationOptions<Order, Error, { id: string; data: any }>
) {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, { id: string; data: any }>({
    mutationFn: async ({ id, data }): Promise<Order> => {
      try {
        const result = await endpoints.orders.update(id, data) as unknown;
        return result as Order;
      } catch (error) {
        logger.error('Failed to update order', { error, id, data });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.setQueryData(['orders', 'detail', variables.id], data);
    },
    ...options,
  });
}
