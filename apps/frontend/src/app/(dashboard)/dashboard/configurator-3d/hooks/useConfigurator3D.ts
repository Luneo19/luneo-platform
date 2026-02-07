/**
 * Hook personnalisé pour gérer le Configurator 3D
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Configuration3D } from '../types';

export function useConfigurator3D(productId: string | null) {
  const router = useRouter();
  const { toast } = useToast();
  const [configuration, setConfiguration] = useState<Configuration3D | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setConfiguration(null);
      return;
    }

    const loadConfiguration = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<{ data?: Configuration3D | null } | Configuration3D>(`/api/v1/configurator-3d/config`, {
          params: { productId },
        });
        const config = (data as { data?: Configuration3D | null })?.data ?? (data as Configuration3D) ?? null;
        const defaultConfig = {
          id: `config-${Date.now()}`,
          productId,
          material: 'leather',
          color: '#000000',
          timestamp: Date.now(),
        };
        setConfiguration(
          config && typeof config === 'object' && 'productId' in config ? config : defaultConfig
        );
      } catch {
        setConfiguration({
          id: `config-${Date.now()}`,
          productId,
          material: 'leather',
          color: '#000000',
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, [productId]);

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
    if (!configuration) {
      return { success: false, error: 'Aucune configuration à sauvegarder' };
    }

    try {
      await api.post('/api/v1/configurator-3d/configurations', {
        productId: configuration.productId,
        configId: configuration.id,
        configuration,
      });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
      logger.error('Error saving 3D configuration', { error });
      return { success: false, error: message };
    }
  }, [configuration]);

  const resetConfiguration = useCallback(() => {
    if (!productId) return;
    setConfiguration({
      id: `config-${Date.now()}`,
      productId,
      material: 'leather',
      color: '#000000',
      timestamp: Date.now(),
    });
  }, [productId]);

  return {
    configuration,
    isLoading,
    updateConfiguration,
    saveConfiguration,
    resetConfiguration,
  };
}



