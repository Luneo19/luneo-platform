/**
 * Selection Store
 * Manages selected objects, hover state, and transformer reference
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import Konva from 'konva';

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
  transformerRef: Konva.Transformer | null;
}

interface SelectionActions {
  select: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  deselect: (id: string) => void;
  deselectAll: () => void;
  setHovered: (id: string | null) => void;
  setTransformerRef: (ref: Konva.Transformer | null) => void;
  isSelected: (id: string) => boolean;
}

type SelectionStore = SelectionState & SelectionActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: SelectionState = {
  selectedIds: [],
  hoveredId: null,
  transformerRef: null,
};

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useSelectionStore = create<SelectionStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        select: (id: string) => {
          set((state) => {
            if (!state.selectedIds.includes(id)) {
              state.selectedIds.push(id);
            }
          });
        },

        selectMultiple: (ids: string[]) => {
          set((state) => {
            // Add new IDs that aren't already selected
            const newIds = ids.filter((id) => !state.selectedIds.includes(id));
            state.selectedIds.push(...newIds);
          });
        },

        deselect: (id: string) => {
          set((state) => {
            state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
          });
        },

        deselectAll: () => {
          set((state) => {
            state.selectedIds = [];
          });
        },

        setHovered: (id: string | null) => {
          set((state) => {
            state.hoveredId = id;
          });
        },

        setTransformerRef: (ref: Konva.Transformer | null) => {
          set((state) => {
            state.transformerRef = ref;
          });
        },

        isSelected: (id: string) => {
          return get().selectedIds.includes(id);
        },
      }))
    ),
    { name: 'SelectionStore' }
  )
);
