'use client';

import { useState, useCallback } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface TryOnConfiguration {
  id: string;
  name: string;
  productType: string;
  isActive: boolean;
  targetZone?: string;
  renderSettings?: Record<string, unknown>;
  calibrationRules?: Record<string, unknown>;
  settings: Record<string, unknown>;
  uiConfig?: Record<string, unknown>;
  mappings?: Array<{
    id: string;
    productId: string;
    model3dUrl?: string;
    modelUSDZUrl?: string;
    thumbnailUrl?: string;
    scaleFactor: number;
    enableOcclusion: boolean;
    enableShadows: boolean;
    product: { id: string; name: string; images?: string[] };
  }>;
}

interface UseTryOnConfigReturn {
  // CRUD
  configurations: TryOnConfiguration[];
  isLoading: boolean;
  error: Error | null;

  // Operations
  loadConfigurations: (projectId: string) => Promise<void>;
  createConfiguration: (
    projectId: string,
    data: { name: string; productType: string; settings?: Record<string, unknown> },
  ) => Promise<TryOnConfiguration | null>;
  updateConfiguration: (
    id: string,
    projectId: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  deleteConfiguration: (id: string, projectId: string) => Promise<void>;

  // Product mappings
  addProduct: (configId: string, projectId: string, productId: string) => Promise<void>;
  removeProduct: (configId: string, projectId: string, productId: string) => Promise<void>;

  // 3D Model management
  uploadModel: (configId: string, file: File, productId: string, format: string) => Promise<void>;
  deleteModel: (configId: string, productId: string) => Promise<void>;
  getModelPreview: (configId: string, productId: string) => Promise<Record<string, unknown> | null>;
}

/**
 * useTryOnConfig - React hook for managing Virtual Try-On configurations.
 *
 * Used in the admin dashboard for:
 * - CRUD operations on try-on configurations
 * - Adding/removing products to configurations
 * - Uploading/managing 3D models
 */
export function useTryOnConfig(): UseTryOnConfigReturn {
  const [configurations, setConfigurations] = useState<TryOnConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadConfigurations = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await endpoints.tryOn.getConfigurations(projectId) as { data?: unknown };
      const data = response.data;
      const configs = Array.isArray(data)
        ? data
        : (data as Record<string, unknown>)?.data
          ? ((data as Record<string, unknown>).data as TryOnConfiguration[])
          : [];
      setConfigurations(configs);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to load configurations');
      setError(e);
      logger.error('Failed to load try-on configurations', { error: e.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConfiguration = useCallback(
    async (
      projectId: string,
      data: { name: string; productType: string; settings?: Record<string, unknown> },
    ): Promise<TryOnConfiguration | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await endpoints.tryOn.createConfiguration(projectId, data) as { data?: unknown };
        const newConfig = response.data as TryOnConfiguration;
        setConfigurations((prev) => [...prev, newConfig]);
        return newConfig;
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to create configuration');
        setError(e);
        logger.error('Failed to create try-on configuration', { error: e.message });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateConfiguration = useCallback(
    async (id: string, projectId: string, data: Record<string, unknown>) => {
      setIsLoading(true);
      try {
        await endpoints.tryOn.updateConfiguration(id, projectId, data);
        setConfigurations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
        );
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to update configuration');
        setError(e);
        logger.error('Failed to update try-on configuration', { error: e.message });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteConfiguration = useCallback(
    async (id: string, projectId: string) => {
      setIsLoading(true);
      try {
        await endpoints.tryOn.deleteConfiguration(id, projectId);
        setConfigurations((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to delete configuration');
        setError(e);
        logger.error('Failed to delete try-on configuration', { error: e.message });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const addProduct = useCallback(
    async (configId: string, projectId: string, productId: string) => {
      setIsLoading(true);
      try {
        await endpoints.tryOn.addProduct(configId, projectId, { productId });
        // Reload configurations to get updated mappings
        await loadConfigurations(projectId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to add product');
        setError(e);
        logger.error('Failed to add product to try-on config', { error: e.message });
      } finally {
        setIsLoading(false);
      }
    },
    [loadConfigurations],
  );

  const removeProduct = useCallback(
    async (configId: string, projectId: string, productId: string) => {
      setIsLoading(true);
      try {
        await endpoints.tryOn.removeProduct(configId, projectId, productId);
        await loadConfigurations(projectId);
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to remove product');
        setError(e);
        logger.error('Failed to remove product from try-on config', { error: e.message });
      } finally {
        setIsLoading(false);
      }
    },
    [loadConfigurations],
  );

  const uploadModel = useCallback(
    async (configId: string, file: File, productId: string, format: string) => {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('model', file);
        formData.append('productId', productId);
        formData.append('format', format);

        await endpoints.tryOn.uploadModel(configId, formData);
        logger.info('3D model uploaded', { configId, productId, format });
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to upload model');
        setError(e);
        logger.error('Failed to upload 3D model', { error: e.message });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteModel = useCallback(
    async (configId: string, productId: string) => {
      setIsLoading(true);
      try {
        await endpoints.tryOn.deleteModel(configId, productId);
        logger.info('3D model deleted', { configId, productId });
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to delete model');
        setError(e);
        logger.error('Failed to delete 3D model', { error: e.message });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getModelPreview = useCallback(
    async (configId: string, productId: string): Promise<Record<string, unknown> | null> => {
      try {
        const response = await endpoints.tryOn.getModelPreview(configId, productId) as { data?: unknown };
        return response.data as Record<string, unknown>;
      } catch (err) {
        logger.error('Failed to get model preview', { error: err });
        return null;
      }
    },
    [],
  );

  return {
    configurations,
    isLoading,
    error,
    loadConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    addProduct,
    removeProduct,
    uploadModel,
    deleteModel,
    getModelPreview,
  };
}
