/**
 * Hook personnalisé pour gérer la bibliothèque AR
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import type { ARModel, ARLibraryStats, ARModelType, ARModelStatus } from '../types';

export function useARLibrary(
  searchTerm: string,
  filterType: string,
  filterStatus: string,
  sortBy: string
) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [models, setModels] = useState<ARModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ models?: ARModel[]; data?: ARModel[] }>('/api/v1/ar-studio/models');
      setModels(data?.models ?? data?.data ?? []);
    } catch (error) {
      logger.error('Failed to fetch AR models', { error });
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch =
        searchTerm === '' ||
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || model.type === filterType;
      const matchesStatus = filterStatus === 'all' || model.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [models, searchTerm, filterType, filterStatus]);

  const sortedModels = useMemo(() => {
    const sorted = [...filteredModels];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'date':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case 'views':
        return sorted.sort((a, b) => b.views - a.views);
      case 'downloads':
        return sorted.sort((a, b) => b.downloads - a.downloads);
      case 'size':
        return sorted.sort((a, b) => b.size - a.size);
      default:
        return sorted;
    }
  }, [filteredModels, sortBy]);

  const stats: ARLibraryStats = useMemo(() => {
    return {
      totalModels: models.length,
      totalSize: models.reduce((acc, m) => acc + m.size, 0),
      totalViews: models.reduce((acc, m) => acc + m.views, 0),
      totalDownloads: models.reduce((acc, m) => acc + m.downloads, 0),
      totalFavorites: models.reduce((acc, m) => acc + m.favorites, 0),
    };
  }, [models]);

  const toggleFavorite = async (modelId: string) => {
    try {
      await api.post(`/api/v1/ar-studio/models/${modelId}/favorite`);
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, isFavorite: !m.isFavorite } : m))
      );
      toast({ title: t('common.success'), description: t('arStudio.favoriteUpdated') });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('aiStudioAnimations.updateError');
      logger.error('Failed to toggle favorite', { error });
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  };

  const deleteModel = async (modelId: string) => {
    try {
      await api.delete(`/api/v1/ar-studio/models/${modelId}`);
      setModels((prev) => prev.filter((m) => m.id !== modelId));
      toast({ title: t('common.success'), description: t('arStudio.modelDeleted') });
      return { success: true };
    } catch (error: unknown) {
      logger.error('Failed to delete model', { error });
      const errorMessage = getErrorDisplayMessage(error);
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  return {
    models: sortedModels,
    allModels: models,
    stats,
    isLoading,
    refetch: fetchModels,
    toggleFavorite,
    deleteModel,
  };
}



