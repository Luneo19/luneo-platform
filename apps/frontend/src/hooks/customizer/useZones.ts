/**
 * useZones
 * Zone CRUD operations via tRPC
 */

'use client';

import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { useCallback } from 'react';

interface UseZonesOptions {
  customizerId: string;
  enabled?: boolean;
}

interface UseZonesReturn {
  zones: unknown[];
  isLoading: boolean;
  error: Error | null;
  createZone: (data: {
    name: string;
    type: string;
    position?: { x: number; y: number; width: number; height: number };
    settings?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) => Promise<unknown>;
  updateZone: (id: string, data: {
    name?: string;
    type?: string;
    position?: { x: number; y: number; width: number; height: number };
    settings?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) => Promise<unknown>;
  deleteZone: (id: string) => Promise<void>;
  reorderZones: (zoneIds: string[]) => Promise<unknown>;
  refetch: () => void;
}

/**
 * Zone management hook using tRPC
 */
export function useZones(options: UseZonesOptions): UseZonesReturn {
  const { customizerId, enabled = true } = options;

  const utils = trpc.useUtils();

  // Query zones
  const {
    data: zonesData,
    isLoading,
    error,
    refetch,
  } = trpc.visualCustomizer.zones.list.useQuery(
    { customizerId },
    {
      enabled: enabled && !!customizerId,
    }
  );

  const zones = zonesData || [];

  // Mutations
  const createMutation = trpc.visualCustomizer.zones.create.useMutation({
    onSuccess: () => {
      utils.visualCustomizer.zones.list.invalidate({ customizerId });
    },
    onError: (err) => {
      logger.error('useZones: create failed', { error: err });
    },
  });

  const updateMutation = trpc.visualCustomizer.zones.update.useMutation({
    onSuccess: () => {
      utils.visualCustomizer.zones.list.invalidate({ customizerId });
    },
    onError: (err) => {
      logger.error('useZones: update failed', { error: err });
    },
  });

  const deleteMutation = trpc.visualCustomizer.zones.delete.useMutation({
    onSuccess: () => {
      utils.visualCustomizer.zones.list.invalidate({ customizerId });
    },
    onError: (err) => {
      logger.error('useZones: delete failed', { error: err });
    },
  });

  const reorderMutation = trpc.visualCustomizer.zones.reorder.useMutation({
    onSuccess: () => {
      utils.visualCustomizer.zones.list.invalidate({ customizerId });
    },
    onError: (err) => {
      logger.error('useZones: reorder failed', { error: err });
    },
  });

  const createZone = useCallback(
    async (data: {
      name: string;
      type: string;
      position?: { x: number; y: number; width: number; height: number };
      settings?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }) => {
      return createMutation.mutateAsync({
        customizerId,
        ...data,
      });
    },
    [customizerId, createMutation]
  );

  const updateZone = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        type?: string;
        position?: { x: number; y: number; width: number; height: number };
        settings?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      }
    ) => {
      return updateMutation.mutateAsync({
        customizerId,
        id,
        ...data,
      });
    },
    [customizerId, updateMutation]
  );

  const deleteZone = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync({
        customizerId,
        id,
      });
    },
    [customizerId, deleteMutation]
  );

  const reorderZones = useCallback(
    async (zoneIds: string[]) => {
      return reorderMutation.mutateAsync({
        customizerId,
        zoneIds,
      });
    },
    [customizerId, reorderMutation]
  );

  return {
    zones,
    isLoading,
    error: error as Error | null,
    createZone,
    updateZone,
    deleteZone,
    reorderZones,
    refetch: () => {
      refetch();
    },
  };
}
