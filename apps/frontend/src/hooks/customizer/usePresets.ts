/**
 * usePresets
 * Preset management hook via tRPC
 */

'use client';

import { useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';

interface UsePresetsOptions {
  customizerId: string;
  enabled?: boolean;
}

interface Preset {
  id: string;
  name: string;
  thumbnail?: string;
  data: Record<string, unknown>;
  createdAt?: string;
}

interface UsePresetsReturn {
  presets: Preset[];
  isLoading: boolean;
  error: Error | null;
  applyPreset: (id: string) => Promise<void>;
  createPreset: (name: string, canvasData: Record<string, unknown>) => Promise<Preset>;
  deletePreset: (id: string) => Promise<void>;
  refetch: () => void;
}

/**
 * Preset management hook
 */
export function usePresets(options: UsePresetsOptions): UsePresetsReturn {
  const { customizerId, enabled = true } = options;

  const utils = trpc.useUtils();

  // Fetch presets (assuming there's a presets endpoint in customizer router)
  // For now, we'll use a placeholder query structure
  const {
    data: presetsData,
    isLoading,
    error,
    refetch,
  } = trpc.visualCustomizer.customizer.getById.useQuery(
    { id: customizerId },
    {
      enabled: enabled && !!customizerId,
      select: (data) => {
        // Extract presets from customizer config
        return (data as { presets?: Preset[] })?.presets || [];
      },
    }
  );

  const presets = presetsData || [];

  // Note: These mutations would need to be added to the customizer router
  // For now, using placeholder implementations
  const applyPreset = useCallback(
    async (id: string): Promise<void> => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) {
        throw new Error(`Preset not found: ${id}`);
      }

      logger.info('usePresets: applying preset', { id, preset });
      // Implementation would apply preset.data to canvas
    },
    [presets]
  );

  const createPreset = useCallback(
    async (name: string, canvasData: Record<string, unknown>): Promise<Preset> => {
      logger.info('usePresets: creating preset', { name, customizerId });
      // This would need a mutation endpoint in the customizer router
      // For now, return a placeholder
      const preset: Preset = {
        id: crypto.randomUUID(),
        name,
        data: canvasData,
        createdAt: new Date().toISOString(),
      };
      return preset;
    },
    [customizerId]
  );

  const deletePreset = useCallback(
    async (id: string): Promise<void> => {
      logger.info('usePresets: deleting preset', { id, customizerId });
      // This would need a mutation endpoint in the customizer router
    },
    [customizerId]
  );

  return {
    presets,
    isLoading,
    error: error as Error | null,
    applyPreset,
    createPreset,
    deletePreset,
    refetch: () => {
      refetch();
    },
  };
}
