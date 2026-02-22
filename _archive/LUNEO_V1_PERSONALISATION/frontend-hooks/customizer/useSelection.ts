/**
 * useSelection
 * Selection management hook with keyboard shortcuts
 * Handles single/multiple selection, hover state, and deletion
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSelectionStore } from '@/stores/customizer';
import { logger } from '@/lib/logger';

interface UseSelectionReturn {
  selectedIds: string[];
  hoveredId: string | null;
  transformerRef: ReturnType<typeof useSelectionStore.getState>['transformerRef'];
  select: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  deselect: (id: string) => void;
  deselectAll: () => void;
  setHovered: (id: string | null) => void;
  setTransformerRef: (transformer: ReturnType<typeof useSelectionStore.getState>['transformerRef']) => void;
  isSelected: (id: string) => boolean;
  removeSelected: () => void;
}

/**
 * Selection management hook with keyboard shortcuts
 */
export function useSelection(onDelete?: (ids: string[]) => void): UseSelectionReturn {
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const hoveredId = useSelectionStore((state) => state.hoveredId);
  const transformerRef = useSelectionStore((state) => state.transformerRef);

  const select = useSelectionStore((state) => state.select);
  const selectMultiple = useSelectionStore((state) => state.selectMultiple);
  const deselect = useSelectionStore((state) => state.deselect);
  const deselectAll = useSelectionStore((state) => state.deselectAll);
  const setHovered = useSelectionStore((state) => state.setHovered);
  const setTransformerRef = useSelectionStore((state) => state.setTransformerRef);
  const isSelected = useSelectionStore((state) => state.isSelected);

  const removeSelected = useCallback(() => {
    if (selectedIds.length === 0) return;

    if (onDelete) {
      onDelete(selectedIds);
    } else {
      logger.warn('useSelection: onDelete callback not provided, cannot remove selected items');
    }
  }, [selectedIds, onDelete]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Delete key - remove selected items
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length > 0) {
          event.preventDefault();
          removeSelected();
        }
      }

      // Escape key - deselect all
      if (event.key === 'Escape') {
        if (selectedIds.length > 0) {
          event.preventDefault();
          deselectAll();
        }
      }
    },
    [selectedIds, removeSelected, deselectAll]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    selectedIds,
    hoveredId,
    transformerRef,
    select,
    selectMultiple,
    deselect,
    deselectAll,
    setHovered,
    setTransformerRef,
    isSelected,
    removeSelected,
  };
}
