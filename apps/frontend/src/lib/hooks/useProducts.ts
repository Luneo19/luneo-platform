import { useState, useEffect } from 'react';
import type { ProductRecord } from '@luneo/types';
import { logger } from '@/lib/logger';

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

  const loadProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products?page=${page}&limit=20`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des produits');
      }

      setProducts(data.data.products);
      setPagination(data.data.pagination);
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
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du produit');
      }

      await loadProducts();
      return { success: true, product: data.data.product };
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
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      await loadProducts();
      return { success: true, product: data.data.product };
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
  };

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      await loadProducts();
      return { success: true, message: data.message };
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
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh: () => loadProducts(pagination.page),
    loadPage: loadProducts,
  };
}
