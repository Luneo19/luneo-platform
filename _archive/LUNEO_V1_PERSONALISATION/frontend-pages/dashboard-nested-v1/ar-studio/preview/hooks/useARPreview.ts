/**
 * Hook personnalisé pour gérer la prévisualisation AR
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { ARModel, ARSession, ARMode, ARPreviewStats } from '../types';

export function useARPreview(
  searchTerm: string,
  filterCategory: string
) {
  const { toast } = useToast();
  const { t } = useI18n();
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
      const data = await api.get<{ models?: ARModel[]; data?: ARModel[] }>('/api/v1/ar-studio/models');
      const modelsList = data?.models ?? data?.data ?? [];
      setModels(modelsList);
      if (modelsList.length > 0) {
        setSelectedModel(modelsList[0].id);
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
      const data = await api.get<{ sessions?: ARSession[]; data?: ARSession[] }>('/api/v1/ar-studio/sessions');
      setSessions(data?.sessions ?? data?.data ?? []);
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
      await api.post('/api/v1/ar-studio/preview/start', { modelId, mode });
      toast({
        title: t('arStudio.previewTitle'),
        description: t('arStudio.previewStarted'),
      });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('arStudio.startError');
      logger.error('Failed to start preview', { error });
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
      setIsPreviewing(false);
      return { success: false, error: message };
    }
  };

  const stopPreview = () => {
    setIsPreviewing(false);
  };

  const generateQRCode = async (modelId: string) => {
    try {
      const res = await api.post<{ data?: { qrCodeUrl?: string; url?: string }; qrCode?: string; url?: string }>(`/api/v1/ar-studio/models/${modelId}/qr-code`, {});
      const data = (res?.data ?? res) as { qrCodeUrl?: string; qrCode?: string; url?: string } | undefined;
      return { success: true, qrCode: data?.qrCodeUrl ?? data?.qrCode, url: data?.url };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate QR code';
      logger.error('Failed to generate QR code', { error });
      return { success: false, error: message };
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



