/**
 * Tools Store
 * Manages active tool state and tool-specific options
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ToolType =
  | 'select'
  | 'text'
  | 'image'
  | 'shape'
  | 'draw'
  | 'eraser'
  | 'colorPicker'
  | 'qrCode';

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface ToolsState {
  activeTool: ToolType;
  toolOptions: Record<string, unknown>;
  currentColor: string;
  currentFontFamily: string;
  currentFontSize: number;
  currentStrokeWidth: number;
  currentOpacity: number;
}

interface ToolsActions {
  setActiveTool: (tool: ToolType) => void;
  setToolOption: (key: string, value: unknown) => void;
  setColor: (color: string) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  resetToolOptions: () => void;
}

type ToolsStore = ToolsState & ToolsActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: ToolsState = {
  activeTool: 'select',
  toolOptions: {},
  currentColor: '#000000',
  currentFontFamily: 'Arial',
  currentFontSize: 24,
  currentStrokeWidth: 2,
  currentOpacity: 1,
};

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useToolsStore = create<ToolsStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        setActiveTool: (tool: ToolType) => {
          set((state) => {
            state.activeTool = tool;
            // Reset tool-specific options when switching tools
            state.toolOptions = {};
          });
        },

        setToolOption: (key: string, value: unknown) => {
          set((state) => {
            state.toolOptions[key] = value;
          });
        },

        setColor: (color: string) => {
          set((state) => {
            state.currentColor = color;
          });
        },

        setFontFamily: (font: string) => {
          set((state) => {
            state.currentFontFamily = font;
          });
        },

        setFontSize: (size: number) => {
          set((state) => {
            state.currentFontSize = Math.max(1, size);
          });
        },

        setStrokeWidth: (width: number) => {
          set((state) => {
            state.currentStrokeWidth = Math.max(0.1, width);
          });
        },

        setOpacity: (opacity: number) => {
          set((state) => {
            state.currentOpacity = Math.max(0, Math.min(1, opacity));
          });
        },

        resetToolOptions: () => {
          set((state) => {
            state.toolOptions = {};
            state.currentColor = '#000000';
            state.currentFontFamily = 'Arial';
            state.currentFontSize = 24;
            state.currentStrokeWidth = 2;
            state.currentOpacity = 1;
          });
        },
      }))
    ),
    { name: 'ToolsStore' }
  )
);
