/**
 * Layers Store
 * Manages layer hierarchy, visibility, locking, and ordering
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type LayerType = 'text' | 'image' | 'shape' | 'group' | 'drawing' | 'rect' | 'circle' | 'ellipse' | 'star' | 'line' | 'arrow';

export interface LayerItem {
  id: string;
  name: string;
  type: LayerType;
  zoneId?: string;
  isVisible: boolean;
  isLocked: boolean;
  isSelected: boolean;
  sortOrder: number;
  opacity: number;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface LayersState {
  layers: LayerItem[];
  activeLayerId: string | null;
}

interface LayersActions {
  setLayers: (layers: LayerItem[]) => void;
  addLayer: (layer: LayerItem) => void;
  updateLayer: (id: string, updates: Partial<LayerItem>) => void;
  removeLayer: (id: string) => void;
  reorderLayers: (layerIds: string[]) => void;
  setActiveLayer: (id: string | null) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  getLayerById: (id: string) => LayerItem | undefined;
}

type LayersStore = LayersState & LayersActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: LayersState = {
  layers: [],
  activeLayerId: null,
};

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useLayersStore = create<LayersStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        setLayers: (layers: LayerItem[]) => {
          set((state) => {
            state.layers = layers;
          });
        },

        addLayer: (layer: LayerItem) => {
          set((state) => {
            state.layers.push(layer);
            // Sort by sortOrder
            state.layers.sort((a, b) => a.sortOrder - b.sortOrder);
          });
        },

        updateLayer: (id: string, updates: Partial<LayerItem>) => {
          set((state) => {
            const layerIndex = state.layers.findIndex((layer) => layer.id === id);
            if (layerIndex !== -1) {
              Object.assign(state.layers[layerIndex], updates);
            }
          });
        },

        removeLayer: (id: string) => {
          set((state) => {
            state.layers = state.layers.filter((layer) => layer.id !== id);
            if (state.activeLayerId === id) {
              state.activeLayerId = null;
            }
          });
        },

        reorderLayers: (layerIds: string[]) => {
          set((state) => {
            // Create a map of new order
            const orderMap = new Map<string, number>();
            layerIds.forEach((id, index) => {
              orderMap.set(id, index);
            });

            // Update sortOrder for each layer
            state.layers.forEach((layer) => {
              const newOrder = orderMap.get(layer.id);
              if (newOrder !== undefined) {
                layer.sortOrder = newOrder;
              }
            });

            // Sort layers by sortOrder
            state.layers.sort((a, b) => a.sortOrder - b.sortOrder);
          });
        },

        setActiveLayer: (id: string | null) => {
          set((state) => {
            state.activeLayerId = id;
          });
        },

        toggleVisibility: (id: string) => {
          set((state) => {
            const layer = state.layers.find((l) => l.id === id);
            if (layer) {
              layer.isVisible = !layer.isVisible;
            }
          });
        },

        toggleLock: (id: string) => {
          set((state) => {
            const layer = state.layers.find((l) => l.id === id);
            if (layer) {
              layer.isLocked = !layer.isLocked;
            }
          });
        },

        getLayerById: (id: string) => {
          return get().layers.find((layer) => layer.id === id);
        },
      }))
    ),
    { name: 'LayersStore' }
  )
);
