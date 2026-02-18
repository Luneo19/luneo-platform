/**
 * useConfigurator3DSelection - Selection logic hook
 * selectOption, deselectOption, toggleOption, resetComponent, resetAll
 * Integrates with rules engine to filter available options
 */

import { useCallback, useMemo } from 'react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { useConfigurator3DRules } from './useConfigurator3DRules';
import type { SelectionState, Configurator3DOption } from '@/lib/configurator-3d/types/configurator.types';

export interface UseConfigurator3DSelectionReturn {
  selections: SelectionState;
  selectOption: (componentId: string, optionId: string) => void;
  deselectOption: (componentId: string, optionId?: string) => void;
  toggleOption: (componentId: string, optionId: string) => void;
  resetComponent: (componentId: string) => void;
  resetAll: () => void;
  isOptionSelected: (componentId: string, optionId: string) => boolean;
  getSelectedOption: (componentId: string) => string | string[] | undefined;
  getAvailableOptions: (componentId: string) => Configurator3DOption[];
}

export function useConfigurator3DSelection(): UseConfigurator3DSelectionReturn {
  const selections = useConfigurator3DStore((s) => s.selections);
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const { disabledOptions, hiddenOptions } = useConfigurator3DRules();

  const selectOption = useCallback((componentId: string, optionId: string) => {
    useConfigurator3DStore.getState().selectOption(componentId, optionId);
  }, []);

  const deselectOption = useCallback((componentId: string, optionId?: string) => {
    useConfigurator3DStore.getState().deselectOption(componentId, optionId);
  }, []);

  const toggleOption = useCallback((componentId: string, optionId: string) => {
    useConfigurator3DStore.getState().toggleOption(componentId, optionId);
  }, []);

  const resetComponent = useCallback((componentId: string) => {
    useConfigurator3DStore.getState().resetComponent(componentId);
  }, []);

  const resetAll = useCallback(() => {
    useConfigurator3DStore.getState().resetAll();
  }, []);

  const isOptionSelected = useCallback(
    (componentId: string, optionId: string): boolean => {
      const sel = selections[componentId];
      if (Array.isArray(sel)) return sel.includes(optionId);
      return sel === optionId;
    },
    [selections]
  );

  const getSelectedOption = useCallback(
    (componentId: string): string | string[] | undefined => {
      return selections[componentId];
    },
    [selections]
  );

  const getAvailableOptions = useCallback(
    (componentId: string): Configurator3DOption[] => {
      const comp = configuration?.components.find((c) => c.id === componentId);
      if (!comp) return [];

      const disabled = disabledOptions[componentId] ?? new Set<string>();
      const hidden = hiddenOptions[componentId] ?? new Set<string>();

      return comp.options.filter(
        (opt) => opt.isEnabled && opt.isVisible && !disabled.has(opt.id) && !hidden.has(opt.id)
      );
    },
    [configuration, disabledOptions, hiddenOptions]
  );

  return {
    selections,
    selectOption,
    deselectOption,
    toggleOption,
    resetComponent,
    resetAll,
    isOptionSelected,
    getSelectedOption,
    getAvailableOptions,
  };
}