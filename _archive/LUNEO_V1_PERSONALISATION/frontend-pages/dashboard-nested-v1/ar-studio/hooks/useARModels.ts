/**
 * Hook personnalisé pour gérer les modèles AR
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { trpc } from '@/lib/trpc/client';
import type { ARModel, ARModelType, ARModelStatus } from '../types';

export function useARModels(
  searchTerm: string,
  filterType: string,
  filterStatus: string
) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [models, setModels] = useState<ARModel[]>([]);

  const modelsQuery = trpc.ar.listModels.useQuery();

  useEffect(() => {
    if (modelsQuery.data?.models) {
      type ModelLike = { id: string; name?: string; category?: string; type?: string; thumbnailUrl?: string; thumbnail_url?: string; fileSize?: number; status?: string; viewsCount?: number; views_count?: number; tryOnsCount?: number; try_ons_count?: number; conversionsCount?: number; conversions_count?: number; createdAt?: string | Date; updatedAt?: string | Date; glbUrl?: string; glb_url?: string; usdzUrl?: string; usdz_url?: string; metadata?: unknown; tags?: string[]; productId?: string; product_id?: string };
      const transformed: ARModel[] = (modelsQuery.data.models as ModelLike[]).map((m) => ({
        id: m.id,
        name: m.name || 'Modèle sans nom',
        type: (m.category || m.type || 'other') as ARModelType,
        thumbnail: m.thumbnailUrl || m.thumbnail_url || '/placeholder-model.svg',
        fileSize: m.fileSize || 0,
        format:
          (m.usdzUrl || m.usdz_url) && (m.glbUrl || m.glb_url)
            ? 'Both'
            : (m.usdzUrl || m.usdz_url)
              ? 'USDZ'
              : 'GLB',
        status: (m.status || 'active') as ARModelStatus,
        views: m.viewsCount || m.views_count || 0,
        tryOns: m.tryOnsCount || m.try_ons_count || 0,
        conversions: m.conversionsCount || m.conversions_count || 0,
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
        glbUrl: m.glbUrl || m.glb_url,
        usdzUrl: m.usdzUrl || m.usdz_url,
        metadata: (m.metadata as Record<string, unknown>) ?? {},
        tags: m.tags || [],
        category: m.category,
        productId: m.productId || m.product_id,
      }));
      setModels(transformed);
    }
  }, [modelsQuery.data]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch =
        searchTerm === '' ||
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (model.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesType = filterType === 'all' || model.type === filterType;
      const matchesStatus = filterStatus === 'all' || model.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [models, searchTerm, filterType, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: models.length,
      active: models.filter((m) => m.status === 'active').length,
      views: models.reduce((sum, m) => sum + m.views, 0),
      tryOns: models.reduce((sum, m) => sum + m.tryOns, 0),
      conversions: models.reduce((sum, m) => sum + m.conversions, 0),
    };
  }, [models]);

  const deleteModel = trpc.ar.deleteModel.useMutation({
    onSuccess: () => {
      modelsQuery.refetch();
      toast({ title: t('common.success'), description: t('arStudio.modelDeleted') });
    },
    onError: (error) => {
      logger.error('Error deleting AR model', { error });
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    },
  });

  const handleDelete = useCallback(
    (modelId: string) => {
      deleteModel.mutate({ id: modelId });
    },
    [deleteModel]
  );

  return {
    models: filteredModels,
    allModels: models,
    stats,
    isLoading: modelsQuery.isLoading,
    error: modelsQuery.error,
    refetch: modelsQuery.refetch,
    deleteModel: handleDelete,
    isDeleting: deleteModel.isPending,
  };
}



