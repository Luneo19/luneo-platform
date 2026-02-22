/**
 * Hook personnalisé pour gérer le Configurator 3D
 * Backend uses project-based configurations: GET/PATCH/DELETE configurations/:id?projectId=
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Configuration3D } from '../types';

interface BackendConfigResponse {
  id: string;
  name?: string;
  description?: string;
  modelUrl?: string;
  sceneConfig?: Record<string, unknown>;
  uiConfig?: Record<string, unknown>;
  options?: Array<{ id: string; name: string; type?: string; label?: string }>;
}

export function useConfigurator3D(
  projectId: string | null,
  configurationId: string | null
) {
  const router = useRouter();
  const { toast } = useToast();
  const [configuration, setConfiguration] = useState<Configuration3D | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !configurationId) {
      setConfiguration(null);
      return;
    }

    const loadConfiguration = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<BackendConfigResponse>(
          `/api/v1/configurator-3d/configurations/${configurationId}`,
          { params: { projectId } }
        );
        const res = data as BackendConfigResponse;
        const defaultConfig: Configuration3D = {
          id: res.id,
          productId: configurationId,
          material: 'leather',
          color: '#000000',
          timestamp: Date.now(),
        };
        const mapped: Configuration3D = {
          ...defaultConfig,
          id: res.id,
          productId: configurationId,
          parts: res.modelUrl ? { modelUrl: res.modelUrl } : undefined,
          options: res.options?.length ? { options: res.options } as unknown as Record<string, unknown> : undefined,
        };
        setConfiguration(mapped);
      } catch (err) {
        logger.error('Configurator 3D config load error', { error: err, projectId, configurationId });
        setConfiguration({
          id: `config-${Date.now()}`,
          productId: configurationId,
          material: 'leather',
          color: '#000000',
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, [projectId, configurationId]);

  const updateConfiguration = useCallback(
    (updates: Partial<Configuration3D>) => {
      setConfiguration((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates,
          version: (prev.version || 0) + 1,
        };
      });
    },
    []
  );

  const saveConfiguration = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!configuration || !projectId) {
      return { success: false, error: 'Aucune configuration ou projet à sauvegarder' };
    }

    try {
      const payload = {
        name: configuration.productName ?? `Config ${configuration.id}`,
        description: undefined as string | undefined,
        sceneConfig: (configuration.parts ?? {}) as Record<string, unknown>,
        uiConfig: (configuration.options ?? {}) as Record<string, unknown>,
        isActive: true,
      };
      if (configuration.id && !configuration.id.startsWith('config-')) {
        await api.patch(
          `/api/v1/configurator-3d/configurations/${configuration.id}`,
          payload,
          { params: { projectId } }
        );
      } else {
        await api.post('/api/v1/configurator-3d/configurations', payload, {
          params: { projectId },
        });
      }
      return { success: true };
    } catch (error: unknown) {
      const message = getErrorDisplayMessage(error);
      logger.error('Error saving 3D configuration', { error });
      return { success: false, error: message };
    }
  }, [configuration, projectId]);

  const resetConfiguration = useCallback(() => {
    if (!configurationId) return;
    setConfiguration({
      id: `config-${Date.now()}`,
      productId: configurationId,
      material: 'leather',
      color: '#000000',
      timestamp: Date.now(),
    });
  }, [configurationId]);

  return {
    configuration,
    isLoading,
    updateConfiguration,
    saveConfiguration,
    resetConfiguration,
  };
}



