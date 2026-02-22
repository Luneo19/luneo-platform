/**
 * useConfigurator3D - Main orchestration hook
 * Combines all sub-hooks
 * Takes configurationId as param
 * Calls store.initialize on mount
 */

import { useEffect, useCallback } from 'react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { useConfigurator3DState } from './useConfigurator3DState';
import { useConfigurator3DSelection } from './useConfigurator3DSelection';
import { useConfigurator3DPricing } from './useConfigurator3DPricing';
import { useConfigurator3DHistory } from './useConfigurator3DHistory';
import { useConfigurator3DExport } from './useConfigurator3DExport';
import { useConfigurator3DAnalytics } from './useConfigurator3DAnalytics';
import { useConfigurator3DCamera } from './useConfigurator3DCamera';
import { useConfigurator3DSession } from './useConfigurator3DSession';
import { useConfigurator3DValidation } from './useConfigurator3DValidation';
import { useConfigurator3DAR } from './useConfigurator3DAR';
import type { Configurator3DConfig, SelectionState } from '@/lib/configurator-3d/types/configurator.types';

export interface UseConfigurator3DParams {
  configurationId: string | null;
  projectId?: string | null;
}

export interface UseConfigurator3DActions {
  select: (componentId: string, optionId: string) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  save: (name?: string, description?: string) => Promise<{ id: string } | null>;
  share: (method?: string) => void;
  exportActions: {
    pdf: (options?: Record<string, unknown>) => Promise<string | null>;
    ar: (options?: Record<string, unknown>) => Promise<string | null>;
    threeD: (options?: Record<string, unknown>) => Promise<string | null>;
    image: (options?: Record<string, unknown>) => Promise<string | null>;
  };
  addToCart: () => Promise<{ success: boolean; error?: string }>;
}

export interface UseConfigurator3DReturn {
  configuration: Configurator3DConfig | null;
  isLoading: boolean;
  error: string | null;
  selections: SelectionState;
  price: number;
  validation: { valid: boolean; errors: unknown[]; warnings: unknown[] };
  actions: UseConfigurator3DActions;
  // Sub-hook returns for advanced usage
  state: ReturnType<typeof useConfigurator3DState>;
  selection: ReturnType<typeof useConfigurator3DSelection>;
  pricing: ReturnType<typeof useConfigurator3DPricing>;
  history: ReturnType<typeof useConfigurator3DHistory>;
  exportActions: ReturnType<typeof useConfigurator3DExport>;
  analytics: ReturnType<typeof useConfigurator3DAnalytics>;
  camera: ReturnType<typeof useConfigurator3DCamera>;
  session: ReturnType<typeof useConfigurator3DSession>;
  validationHook: ReturnType<typeof useConfigurator3DValidation>;
  ar: ReturnType<typeof useConfigurator3DAR>;
}

export function useConfigurator3D(params: UseConfigurator3DParams): UseConfigurator3DReturn {
  const { configurationId, projectId } = params;

  const state = useConfigurator3DState();
  const selection = useConfigurator3DSelection();
  const pricing = useConfigurator3DPricing(configurationId);
  const history = useConfigurator3DHistory();
  const exportHook = useConfigurator3DExport();
  const analytics = useConfigurator3DAnalytics();
  const camera = useConfigurator3DCamera();
  const session = useConfigurator3DSession(configurationId);
  const validationHook = useConfigurator3DValidation(configurationId);
  const ar = useConfigurator3DAR();

  useEffect(() => {
    if (!configurationId) return;
    useConfigurator3DStore.getState().initialize(configurationId, projectId ?? undefined);
  }, [configurationId, projectId]);

  const select = useCallback(
    (componentId: string, optionId: string) => {
      selection.selectOption(componentId, optionId);
      analytics.trackOptionSelect(componentId, optionId);
    },
    [selection, analytics]
  );

  const reset = useCallback(() => {
    selection.resetAll();
    camera.resetCamera();
    analytics.trackReset();
  }, [selection, camera, analytics]);

  const save = useCallback(
    async (name?: string, description?: string) => {
      const result = await session.saveSession(name, description);
      if (result) analytics.trackSave(result.id);
      return result;
    },
    [session, analytics]
  );

  const share = useCallback(
    (method = 'link') => {
      analytics.trackShare(method);
      // Share logic would generate link and copy to clipboard
    },
    [analytics]
  );

  const addToCart = useCallback(async () => {
    const result = await session.addToCart();
    if (result.success) analytics.trackAddToCart();
    return result;
  }, [session, analytics]);

  const actions: UseConfigurator3DActions = {
    select,
    reset,
    undo: history.undo,
    redo: history.redo,
    save,
    share,
    exportActions: {
      pdf: exportHook.exportPDF,
      ar: exportHook.exportAR,
      threeD: exportHook.export3D,
      image: exportHook.exportImage,
    },
    addToCart,
  };

  return {
    configuration: state.configuration,
    isLoading: state.isLoading,
    error: state.error,
    selections: state.selections,
    price: state.price,
    validation: state.validation,
    actions,
    state,
    selection,
    pricing,
    history,
    exportActions: exportHook,
    analytics,
    camera,
    session,
    validationHook,
    ar,
  };
}