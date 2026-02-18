/**
 * useConfigurator3DState - Store connection hook
 * Returns typed subset of Zustand store state and subscribes to changes
 */

import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { Configurator3DConfig, SelectionState, PriceBreakdown, ValidationResult, HistoryEntry } from '@/lib/configurator-3d/types/configurator.types';

export interface Configurator3DStateSelectors {
  configuration: Configurator3DConfig | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  sessionId: string | null;
  selections: SelectionState;
  defaultSelections: SelectionState;
  price: number;
  priceBreakdown: PriceBreakdown | null;
  isPriceCalculating: boolean;
  validation: ValidationResult;
  history: HistoryEntry[];
  historyIndex: number;
  ui: {
    selectedComponentId: string | null;
    hoveredOptionId: string | null;
    isFullscreen: boolean;
    isPanelCollapsed: boolean;
    activeModal: string | null;
    zoom: number;
  };
  scene: {
    isSceneReady: boolean;
    isModelLoaded: boolean;
    loadingProgress: number;
    cameraPosition: { x: number; y: number; z: number } | null;
    cameraTarget: { x: number; y: number; z: number } | null;
  };
}

/**
 * Returns the full configurator state from the store.
 * Subscribes to all state changes.
 */
export function useConfigurator3DState(): Configurator3DStateSelectors {
  return useConfigurator3DStore((state) => ({
    configuration: state.configuration,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    sessionId: state.sessionId,
    selections: state.selections,
    defaultSelections: state.defaultSelections,
    price: state.price,
    priceBreakdown: state.priceBreakdown,
    isPriceCalculating: state.isPriceCalculating,
    validation: state.validation,
    history: state.history,
    historyIndex: state.historyIndex,
    ui: state.ui,
    scene: state.scene,
  }));
}

/**
 * Returns a specific slice of state for optimized re-renders.
 */
export function useConfigurator3DStateSlice<T>(selector: (state: ReturnType<typeof useConfigurator3DStore.getState>) => T): T {
  return useConfigurator3DStore(selector);
}