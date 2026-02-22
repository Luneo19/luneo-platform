/**
 * useCanvas
 * Canvas operations hook for zoom, pan, grid, rulers, and fullscreen
 * Includes keyboard shortcuts support
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/customizer';
import Konva from 'konva';

interface UseCanvasReturn {
  stageRef: Konva.Stage | null;
  zoom: number;
  panX: number;
  panY: number;
  canvasWidth: number;
  canvasHeight: number;
  showGrid: boolean;
  showRulers: boolean;
  isFullscreen: boolean;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
  setPan: (x: number, y: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleFullscreen: () => void;
  getCanvasCenter: () => { x: number; y: number };
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
}

/**
 * Canvas operations hook with keyboard shortcuts
 */
export function useCanvas(): UseCanvasReturn {
  const stageRef = useCanvasStore((state) => state.stageRef);
  const zoom = useCanvasStore((state) => state.zoom);
  const panX = useCanvasStore((state) => state.panX);
  const panY = useCanvasStore((state) => state.panY);
  const canvasWidth = useCanvasStore((state) => state.canvasWidth);
  const canvasHeight = useCanvasStore((state) => state.canvasHeight);
  const showGrid = useCanvasStore((state) => state.showGrid);
  const showRulers = useCanvasStore((state) => state.showRulers);
  const isFullscreen = useCanvasStore((state) => state.isFullscreen);

  const setZoom = useCanvasStore((state) => state.setZoom);
  const zoomIn = useCanvasStore((state) => state.zoomIn);
  const zoomOut = useCanvasStore((state) => state.zoomOut);
  const resetZoom = useCanvasStore((state) => state.resetZoom);
  const fitToScreen = useCanvasStore((state) => state.fitToScreen);
  const setPan = useCanvasStore((state) => state.setPan);
  const setCanvasSize = useCanvasStore((state) => state.setCanvasSize);
  const toggleGrid = useCanvasStore((state) => state.toggleGrid);
  const toggleRulers = useCanvasStore((state) => state.toggleRulers);
  const toggleFullscreen = useCanvasStore((state) => state.toggleFullscreen);
  const getCanvasCenter = useCanvasStore((state) => state.getCanvasCenter);
  const screenToCanvas = useCanvasStore((state) => state.screenToCanvas);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // Zoom shortcuts
      if (ctrlKey && event.key === '=') {
        event.preventDefault();
        zoomIn();
      } else if (ctrlKey && event.key === '-') {
        event.preventDefault();
        zoomOut();
      } else if (ctrlKey && event.key === '0') {
        event.preventDefault();
        resetZoom();
      }
    },
    [zoomIn, zoomOut, resetZoom]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    stageRef,
    zoom,
    panX,
    panY,
    canvasWidth,
    canvasHeight,
    showGrid,
    showRulers,
    isFullscreen,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    setPan,
    setCanvasSize,
    toggleGrid,
    toggleRulers,
    toggleFullscreen,
    getCanvasCenter,
    screenToCanvas,
  };
}
