/**
 * Hook personnalisé pour gérer le Configurator 3D
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
        const response = await fetch(`/api/3d/config?productId=${productId}`);
        if (response.ok) {
          const data = await response.json();
          setConfiguration(data.data || null);
        } else {
          // Créer une configuration par défaut
          setConfiguration({
            id: `config-${Date.now()}`,
            productId,
            material: 'leather',
            color: '#000000',
            timestamp: Date.now(),
          });
        }
      } catch (error: any) {
        logger.error('Error loading 3D configuration', { error });
        // Créer une configuration par défaut en cas d'erreur
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
      const response = await fetch('/api/3d-configurations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: configuration.productId,
          configId: configuration.id,
          configuration,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Error saving 3D configuration', { error });
      return { success: false, error: error.message || 'Erreur lors de la sauvegarde' };
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


