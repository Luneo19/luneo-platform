/**
 * ★★★ HOOK - PRODUCTS (React Query) ★★★
 * Hooks React Query pour gérer les produits
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductsListParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface ProductsListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Hook pour lister les produits
 */
export function useProducts(
  params: ProductsListParams = {},
  options?: Omit<UseQueryOptions<ProductsListResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ProductsListResponse>({
    queryKey: ['products', 'list', params],
    queryFn: async () => {
      try {
        const response = await endpoints.products.list(params);
        
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
        
        return response as ProductsListResponse;
      } catch (error) {
        logger.error('Failed to fetch products', { error, params });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour récupérer un produit spécifique
 */
export function useProduct(
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Product>({
    queryKey: ['products', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
      try {
        return await endpoints.products.get(id);
      } catch (error) {
        logger.error('Failed to fetch product', { error, id });
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

/**
 * Hook pour créer un produit
 */
export function useCreateProduct(
  options?: UseMutationOptions<Product, Error, any>
) {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, any>({
    mutationFn: async (data) => {
      try {
        const result = await endpoints.products.create(data);
        return result as Product;
      } catch (error) {
        logger.error('Failed to create product', { error, data });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      queryClient.setQueryData(['products', 'detail', data.id], data);
    },
    ...options,
  });
}

/**
 * Hook pour mettre à jour un produit
 */
export function useUpdateProduct(
  options?: UseMutationOptions<Product, Error, { id: string; data: any }>
) {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, { id: string; data: any }>({
    mutationFn: async ({ id, data }) => {
      try {
        const result = await endpoints.products.update(id, data);
        return result as Product;
      } catch (error) {
        logger.error('Failed to update product', { error, id, data });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      queryClient.setQueryData(['products', 'detail', variables.id], data);
    },
    ...options,
  });
}

/**
 * Hook pour supprimer un produit
 */
export function useDeleteProduct(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        await endpoints.products.delete(id);
      } catch (error) {
        logger.error('Failed to delete product', { error, id });
        throw error;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      queryClient.removeQueries({ queryKey: ['products', 'detail', id] });
    },
    ...options,
  });
}
