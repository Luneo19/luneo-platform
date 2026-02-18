/**
 * useCustomizerState
 * Combined state hook that aggregates data from multiple stores
 * Uses shallow comparisons to avoid unnecessary re-renders
 */

'use client';

import { useMemo } from 'react';
import { useCustomizerStore } from '@/stores/customizer';
import { useCanvasStore } from '@/stores/customizer';
import { useSelectionStore } from '@/stores/customizer';
import { useToolsStore } from '@/stores/customizer';
import { useLayersStore } from '@/stores/customizer';
import { useSessionStore } from '@/stores/customizer';
import type { CustomizerConfig } from '@/stores/customizer';
import type { ToolType } from '@/stores/customizer';
import type { LayerItem } from '@/stores/customizer';
import type { SessionStatus } from '@/stores/customizer';

interface UseCustomizerStateReturn {
  config: CustomizerConfig | null;
  zoom: number;
  activeTool: ToolType;
  selectedIds: string[];
  hoveredId: string | null;
  layers: LayerItem[];
  activeLayerId: string | null;
  sessionStatus: SessionStatus;
  isDirty: boolean;
  isLoading: boolean;
}

/**
 * Combined state hook for convenient access to all customizer state
 */
export function useCustomizerState(): UseCustomizerStateReturn {
  // Customizer store
  const config = useCustomizerStore((state) => state.config);
  const isLoading = useCustomizerStore((state) => state.isLoading);

  // Canvas store
  const zoom = useCanvasStore((state) => state.zoom);

  // Selection store
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const hoveredId = useSelectionStore((state) => state.hoveredId);

  // Tools store
  const activeTool = useToolsStore((state) => state.activeTool);

  // Layers store
  const layers = useLayersStore((state) => state.layers);
  const activeLayerId = useLayersStore((state) => state.activeLayerId);

  // Session store
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const isDirty = useSessionStore((state) => state.isDirty);

  // Memoize to prevent unnecessary re-renders
  return useMemo(
    () => ({
      config,
      zoom,
      activeTool,
      selectedIds,
      hoveredId,
      layers,
      activeLayerId,
      sessionStatus,
      isDirty,
      isLoading,
    }),
    [config, zoom, activeTool, selectedIds, hoveredId, layers, activeLayerId, sessionStatus, isDirty, isLoading]
  );
}
