/**
 * useLayers
 * Layer management hook for hierarchy, visibility, locking, and ordering
 */

'use client';

import { useLayersStore } from '@/stores/customizer';
import type { LayerItem } from '@/stores/customizer';

interface UseLayersReturn {
  layers: LayerItem[];
  activeLayerId: string | null;
  addLayer: (layer: LayerItem) => void;
  updateLayer: (id: string, updates: Partial<LayerItem>) => void;
  removeLayer: (id: string) => void;
  reorderLayers: (layerIds: string[]) => void;
  setActiveLayer: (id: string | null) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  getLayerById: (id: string) => LayerItem | undefined;
  setLayers: (layers: LayerItem[]) => void;
}

/**
 * Layer management hook
 */
export function useLayers(): UseLayersReturn {
  const layers = useLayersStore((state) => state.layers);
  const activeLayerId = useLayersStore((state) => state.activeLayerId);
  const addLayer = useLayersStore((state) => state.addLayer);
  const updateLayer = useLayersStore((state) => state.updateLayer);
  const removeLayer = useLayersStore((state) => state.removeLayer);
  const reorderLayers = useLayersStore((state) => state.reorderLayers);
  const setActiveLayer = useLayersStore((state) => state.setActiveLayer);
  const toggleVisibility = useLayersStore((state) => state.toggleVisibility);
  const toggleLock = useLayersStore((state) => state.toggleLock);
  const getLayerById = useLayersStore((state) => state.getLayerById);
  const setLayers = useLayersStore((state) => state.setLayers);

  return {
    layers,
    activeLayerId,
    addLayer,
    updateLayer,
    removeLayer,
    reorderLayers,
    setActiveLayer,
    toggleVisibility,
    toggleLock,
    getLayerById,
    setLayers,
  };
}
