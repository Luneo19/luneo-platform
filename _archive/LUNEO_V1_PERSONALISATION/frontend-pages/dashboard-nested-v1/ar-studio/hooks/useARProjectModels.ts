/**
 * Hook for project-scoped AR models (list, convert, optimize, delete)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export type ModelFormat = 'GLB' | 'USDZ' | 'Draco';
export type ConversionStatus = 'pending' | 'converting' | 'done' | 'error';
export type ValidationStatus = 'valid' | 'invalid' | 'pending';

export interface ProjectARModel {
  id: string;
  name: string;
  thumbnailUrl?: string;
  format: ModelFormat[];
  polyCount?: number;
  fileSize?: number;
  conversionStatus?: ConversionStatus;
  validationStatus?: ValidationStatus;
  lodLevels?: number;
  createdAt?: string;
}

export function useARProjectModels(projectId: string | null) {
  const [models, setModels] = useState<ProjectARModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModels = useCallback(async () => {
    if (!projectId) {
      setModels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await endpoints.ar.projects.models.list(projectId) as { data?: ProjectARModel[] };
      const data = body?.data ?? [];
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('Failed to fetch project models', { error: err });
      setError(err instanceof Error ? err : new Error(String(err)));
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const convert = useCallback(
    async (modelId: string) => {
      if (!projectId) return;
      try {
        await endpoints.ar.projects.models.convert(projectId, modelId);
        await fetchModels();
      } catch (err) {
        logger.error('Convert failed', { error: err });
        throw err;
      }
    },
    [projectId, fetchModels]
  );

  const optimize = useCallback(
    async (modelId: string) => {
      if (!projectId) return;
      try {
        await endpoints.ar.projects.models.optimize(projectId, modelId);
        await fetchModels();
      } catch (err) {
        logger.error('Optimize failed', { error: err });
        throw err;
      }
    },
    [projectId, fetchModels]
  );

  const remove = useCallback(
    async (modelId: string) => {
      if (!projectId) return;
      try {
        await endpoints.ar.projects.models.delete(projectId, modelId);
        setModels((prev) => prev.filter((m) => m.id !== modelId));
      } catch (err) {
        logger.error('Delete model failed', { error: err });
        throw err;
      }
    },
    [projectId]
  );

  return { models, loading, error, refetch: fetchModels, convert, optimize, deleteModel: remove };
}
