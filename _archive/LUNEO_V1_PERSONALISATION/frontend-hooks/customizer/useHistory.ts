/**
 * useHistory
 * Undo/redo functionality hook with keyboard shortcuts
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useHistoryStore } from '@/stores/customizer';

interface UseHistoryReturn {
  undo: () => unknown | null;
  redo: () => unknown | null;
  canUndo: boolean;
  canRedo: boolean;
  pushState: (entry: { label: string; snapshot: unknown }) => void;
  clearHistory: () => void;
  undoStackLength: number;
  redoStackLength: number;
}

/**
 * History management hook with keyboard shortcuts
 */
export function useHistory(): UseHistoryReturn {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const pushState = useHistoryStore((state) => state.pushState);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const undoStack = useHistoryStore((state) => state.undoStack);
  const redoStack = useHistoryStore((state) => state.redoStack);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // Undo: Ctrl+Z (or Cmd+Z on Mac)
      if (ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y (or Cmd+Shift+Z / Cmd+Y on Mac)
      if (ctrlKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    },
    [canUndo, canRedo, undo, redo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    pushState,
    clearHistory,
    undoStackLength: undoStack.length,
    redoStackLength: redoStack.length,
  };
}
