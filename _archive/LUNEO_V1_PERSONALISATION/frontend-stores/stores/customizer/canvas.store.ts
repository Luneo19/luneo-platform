/**
 * Canvas Store
 * Manages canvas state, zoom, pan, and viewport transformations
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import Konva from 'konva';

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface CanvasState {
  stageRef: Konva.Stage | null;
  zoom: number;
  panX: number;
  panY: number;
  canvasWidth: number;
  canvasHeight: number;
  showGrid: boolean;
  showRulers: boolean;
  showSafeZone: boolean;
  isFullscreen: boolean;
}

interface CanvasActions {
  setStageRef: (stage: Konva.Stage | null) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
  setPan: (x: number, y: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSafeZone: () => void;
  toggleFullscreen: () => void;
  getCanvasCenter: () => { x: number; y: number };
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
}

type CanvasStore = CanvasState & CanvasActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: CanvasState = {
  stageRef: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  canvasWidth: 800,
  canvasHeight: 800,
  showGrid: false,
  showRulers: true,
  showSafeZone: true,
  isFullscreen: false,
};

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        setStageRef: (stage: Konva.Stage | null) => {
          set((state) => {
            // Immer WritableDraft<Stage> is incompatible with Konva.Stage (DOM ref); we only store the ref, never mutate it
            (state as { stageRef: Konva.Stage | null }).stageRef = stage;
          });
        },

        setZoom: (zoom: number) => {
          const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
          set((state) => {
            state.zoom = clampedZoom;
          });
        },

        zoomIn: () => {
          const { zoom } = get();
          get().setZoom(zoom + ZOOM_STEP);
        },

        zoomOut: () => {
          const { zoom } = get();
          get().setZoom(zoom - ZOOM_STEP);
        },

        resetZoom: () => {
          set((state) => {
            state.zoom = 1;
            state.panX = 0;
            state.panY = 0;
          });
        },

        fitToScreen: () => {
          const { stageRef, canvasWidth, canvasHeight } = get();
          if (!stageRef) return;

          const container = stageRef.container();
          if (!container) return;

          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;

          const scaleX = containerWidth / canvasWidth;
          const scaleY = containerHeight / canvasHeight;
          const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

          const newX = (containerWidth - canvasWidth * scale) / 2;
          const newY = (containerHeight - canvasHeight * scale) / 2;

          set((state) => {
            state.zoom = scale;
            state.panX = newX;
            state.panY = newY;
          });
        },

        setPan: (x: number, y: number) => {
          set((state) => {
            state.panX = x;
            state.panY = y;
          });
        },

        setCanvasSize: (width: number, height: number) => {
          set((state) => {
            state.canvasWidth = width;
            state.canvasHeight = height;
          });
        },

        toggleGrid: () => {
          set((state) => {
            state.showGrid = !state.showGrid;
          });
        },

        toggleRulers: () => {
          set((state) => {
            state.showRulers = !state.showRulers;
          });
        },

        toggleSafeZone: () => {
          set((state) => {
            state.showSafeZone = !state.showSafeZone;
          });
        },

        toggleFullscreen: () => {
          set((state) => {
            state.isFullscreen = !state.isFullscreen;
          });
        },

        getCanvasCenter: () => {
          const { canvasWidth, canvasHeight } = get();
          return {
            x: canvasWidth / 2,
            y: canvasHeight / 2,
          };
        },

        screenToCanvas: (screenX: number, screenY: number) => {
          const { zoom, panX, panY } = get();
          return {
            x: (screenX - panX) / zoom,
            y: (screenY - panY) / zoom,
          };
        },
      }))
    ),
    { name: 'CanvasStore' }
  )
);
