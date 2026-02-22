/**
 * useConfigurator3DHistory - Undo/Redo
 * Keyboard shortcuts: Ctrl+Z, Ctrl+Y
 */

import { useEffect, useCallback } from 'react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { HistoryEntry } from '@/lib/configurator-3d/types/configurator.types';

export interface UseConfigurator3DHistoryReturn {
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export function useConfigurator3DHistory(): UseConfigurator3DHistoryReturn {
  const history = useConfigurator3DStore((s) => s.history);
  const historyIndex = useConfigurator3DStore((s) => s.historyIndex);

  const undo = useCallback(() => {
    useConfigurator3DStore.getState().undo();
  }, []);

  const redo = useCallback(() => {
    useConfigurator3DStore.getState().redo();
  }, []);

  const clearHistory = useCallback(() => {
    useConfigurator3DStore.getState().clearHistory();
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    history,
    historyIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHistory,
  };
}