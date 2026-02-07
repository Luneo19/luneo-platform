import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProductRecord } from '@/lib/types';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

type Product = ProductRecord;
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const loadProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const data = await endpoints.products.list({ page, limit: 20 });
      const raw = data as { data?: { products?: Product[]; pagination?: typeof pagination }; products?: Product[]; pagination?: typeof pagination };
      const list = raw?.data?.products ?? raw?.products ?? [];
      const pag = raw?.data?.pagination ?? raw?.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 };
      setProducts(Array.isArray(list) ? list : []);
      setPagination(pag);
    } catch (err: any) {
      logger.error('Erreur chargement products', {
        error: err,
        page,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: Partial<Product>) => {
    try {
      setLoading(true);
      setError(null);

      const data = await endpoints.products.create(productData);
      const raw = data as { data?: { product?: Product }; product?: Product };
      const product = raw?.data?.product ?? raw?.product;
      await loadProducts();
      return { success: true, product };
    } catch (err: any) {
      logger.error('Erreur création product', {
        error: err,
        productData,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      setLoading(true);
      setError(null);

      const data = await endpoints.products.update(id, updates);
      const raw = data as { data?: { product?: Product }; product?: Product };
      const product = raw?.data?.product ?? raw?.product;
      await loadProducts();
      return { success: true, product };
    } catch (err: any) {
      logger.error('Erreur mise à jour product', {
        error: err,
        productId: id,
        updates,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await endpoints.products.delete(id);
      await loadProducts();
      return { success: true, message: 'Produit supprimé' };
    } catch (err: any) {
      logger.error('Erreur suppression product', {
        error: err,
        productId: id,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refresh = useCallback(() => {
    loadProducts(pagination.page);
  }, [loadProducts, pagination.page]);

  const memoizedProducts = useMemo(() => products, [products]);
  const memoizedPagination = useMemo(() => pagination, [pagination]);

  return {
    products: memoizedProducts,
    loading,
    error,
    pagination: memoizedPagination,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh,
    loadPage: loadProducts,
  };
}
