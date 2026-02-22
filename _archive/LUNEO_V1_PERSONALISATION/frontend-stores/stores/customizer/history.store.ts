/**
 * History Store
 * Manages undo/redo functionality with state snapshots
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface HistoryEntry {
  label: string;
  snapshot: unknown;
  timestamp: number;
}

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface HistoryState {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  isSaving: boolean;
}

interface HistoryActions {
  pushState: (entry: { label: string; snapshot: unknown }) => void;
  undo: () => unknown | null;
  redo: () => unknown | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

type HistoryStore = HistoryState & HistoryActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: HistoryState = {
  undoStack: [],
  redoStack: [],
  isSaving: false,
};

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const MAX_HISTORY_SIZE = 100;

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useHistoryStore = create<HistoryStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        pushState: (entry: { label: string; snapshot: unknown }) => {
          set((state) => {
            const historyEntry: HistoryEntry = {
              label: entry.label,
              snapshot: entry.snapshot,
              timestamp: Date.now(),
            };

            // Add to undo stack
            state.undoStack.push(historyEntry);

            // Limit stack size
            if (state.undoStack.length > MAX_HISTORY_SIZE) {
              state.undoStack.shift();
            }

            // Clear redo stack when new action is performed
            state.redoStack = [];
          });
        },

        undo: () => {
          const { undoStack, redoStack } = get();
          if (undoStack.length === 0) {
            return null;
          }

          const entry = undoStack[undoStack.length - 1];

          set((state) => {
            // Remove from undo stack
            state.undoStack.pop();

            // Add to redo stack
            state.redoStack.push(entry);
          });

          return entry.snapshot;
        },

        redo: () => {
          const { redoStack, undoStack } = get();
          if (redoStack.length === 0) {
            return null;
          }

          const entry = redoStack[redoStack.length - 1];

          set((state) => {
            // Remove from redo stack
            state.redoStack.pop();

            // Add to undo stack
            state.undoStack.push(entry);
          });

          return entry.snapshot;
        },

        canUndo: () => {
          return get().undoStack.length > 0;
        },

        canRedo: () => {
          return get().redoStack.length > 0;
        },

        clearHistory: () => {
          set((state) => {
            state.undoStack = [];
            state.redoStack = [];
          });
        },
      }))
    ),
    { name: 'HistoryStore' }
  )
);
