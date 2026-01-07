/**
 * Hook personnalisé pour gérer la bibliothèque AR
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { ARModel, ARLibraryStats, ARModelType, ARModelStatus } from '../types';

export function useARLibrary(
  searchTerm: string,
  filterType: string,
  filterStatus: string,
  sortBy: string
) {
  const { toast } = useToast();
  const [models, setModels] = useState<ARModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ar-studio/library/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || data.data || []);
      } else {
        // Fallback to empty array if API fails
        setModels([]);
      }
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
      const response = await fetch(`/api/ar-studio/library/models/${modelId}/favorite`, {
        method: 'POST',
      });
      if (response.ok) {
        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, isFavorite: !m.isFavorite } : m))
        );
        toast({ title: 'Succès', description: 'Favori mis à jour' });
        return { success: true };
      }
      throw new Error('Failed to toggle favorite');
    } catch (error: any) {
      logger.error('Failed to toggle favorite', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const deleteModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ar-studio/library/models/${modelId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setModels((prev) => prev.filter((m) => m.id !== modelId));
        toast({ title: 'Succès', description: 'Modèle supprimé' });
        return { success: true };
      }
      throw new Error('Failed to delete model');
    } catch (error: any) {
      logger.error('Failed to delete model', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
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


