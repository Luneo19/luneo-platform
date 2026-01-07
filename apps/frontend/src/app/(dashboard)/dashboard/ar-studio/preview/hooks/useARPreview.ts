/**
 * Hook personnalisé pour gérer la prévisualisation AR
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { ARModel, ARSession, ARMode, ARPreviewStats } from '../types';

export function useARPreview(
  searchTerm: string,
  filterCategory: string
) {
  const { toast } = useToast();
  const [models, setModels] = useState<ARModel[]>([]);
  const [sessions, setSessions] = useState<ARSession[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchModels();
    fetchSessions();
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ar-studio/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || data.data || []);
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0].id);
        }
      } else {
        setModels([]);
      }
    } catch (error) {
      logger.error('Failed to fetch AR models', { error });
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/ar-studio/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || data.data || []);
      } else {
        setSessions([]);
      }
    } catch (error) {
      logger.error('Failed to fetch AR sessions', { error });
      setSessions([]);
    }
  };

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch =
        searchTerm === '' ||
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || model.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, searchTerm, filterCategory]);

  const selectedModelData = useMemo(() => {
    return models.find((m) => m.id === selectedModel) || models[0];
  }, [models, selectedModel]);

  const stats: ARPreviewStats = useMemo(() => {
    return {
      totalModels: models.length,
      totalViews: models.reduce((sum, m) => sum + m.views, 0),
      totalSessions: models.reduce((sum, m) => sum + m.sessions, 0),
      avgSessionDuration:
        models.length > 0
          ? Math.round(
              models.reduce((sum, m) => sum + m.avgSessionDuration, 0) / models.length
            )
          : 0,
      readyModels: models.filter((m) => m.status === 'ready').length,
      byPlatform: {
        ios: models.filter((m) => m.platformSupport?.includes('ios')).length,
        android: models.filter((m) => m.platformSupport?.includes('android')).length,
        web: models.filter((m) => m.platformSupport?.includes('web')).length,
      },
    };
  }, [models]);

  const startPreview = async (modelId: string, mode: ARMode) => {
    try {
      setIsPreviewing(true);
      const response = await fetch('/api/ar-studio/preview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, mode }),
      });
      if (response.ok) {
        toast({
          title: 'Prévisualisation AR',
          description: 'Ouvrez votre appareil mobile pour voir le modèle en AR',
        });
        return { success: true };
      }
      throw new Error('Failed to start preview');
    } catch (error: any) {
      logger.error('Failed to start preview', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du démarrage',
        variant: 'destructive',
      });
      setIsPreviewing(false);
      return { success: false, error: error.message };
    }
  };

  const stopPreview = () => {
    setIsPreviewing(false);
  };

  const generateQRCode = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ar-studio/preview/qr/${modelId}`);
      if (response.ok) {
        const data = await response.json();
        return { success: true, qrCode: data.qrCode, url: data.url };
      }
      throw new Error('Failed to generate QR code');
    } catch (error: any) {
      logger.error('Failed to generate QR code', { error });
      return { success: false, error: error.message };
    }
  };

  return {
    models: filteredModels,
    allModels: models,
    sessions,
    selectedModel,
    selectedModelData,
    isPreviewing,
    stats,
    isLoading,
    setSelectedModel,
    startPreview,
    stopPreview,
    generateQRCode,
    refetch: fetchModels,
  };
}


