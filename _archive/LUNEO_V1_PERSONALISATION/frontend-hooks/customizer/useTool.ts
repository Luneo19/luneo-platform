/**
 * useTool
 * Tool switching and options management hook
 * Includes keyboard shortcuts for tool switching
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useToolsStore } from '@/stores/customizer';
import type { ToolType } from '@/stores/customizer';

interface UseToolReturn {
  activeTool: ToolType;
  toolOptions: Record<string, unknown>;
  currentColor: string;
  currentFontFamily: string;
  currentFontSize: number;
  currentStrokeWidth: number;
  currentOpacity: number;
  setActiveTool: (tool: ToolType) => void;
  setToolOption: (key: string, value: unknown) => void;
  setColor: (color: string) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  resetToolOptions: () => void;
}

/**
 * Tool management hook with keyboard shortcuts
 */
export function useTool(): UseToolReturn {
  const activeTool = useToolsStore((state) => state.activeTool);
  const toolOptions = useToolsStore((state) => state.toolOptions);
  const currentColor = useToolsStore((state) => state.currentColor);
  const currentFontFamily = useToolsStore((state) => state.currentFontFamily);
  const currentFontSize = useToolsStore((state) => state.currentFontSize);
  const currentStrokeWidth = useToolsStore((state) => state.currentStrokeWidth);
  const currentOpacity = useToolsStore((state) => state.currentOpacity);

  const setActiveTool = useToolsStore((state) => state.setActiveTool);
  const setToolOption = useToolsStore((state) => state.setToolOption);
  const setColor = useToolsStore((state) => state.setColor);
  const setFontFamily = useToolsStore((state) => state.setFontFamily);
  const setFontSize = useToolsStore((state) => state.setFontSize);
  const setStrokeWidth = useToolsStore((state) => state.setStrokeWidth);
  const setOpacity = useToolsStore((state) => state.setOpacity);
  const resetToolOptions = useToolsStore((state) => state.resetToolOptions);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Tool switching shortcuts
      switch (event.key.toLowerCase()) {
        case 'v':
          event.preventDefault();
          setActiveTool('select');
          break;
        case 't':
          event.preventDefault();
          setActiveTool('text');
          break;
        case 'i':
          event.preventDefault();
          setActiveTool('image');
          break;
        case 's':
          event.preventDefault();
          setActiveTool('shape');
          break;
        case 'd':
          event.preventDefault();
          setActiveTool('draw');
          break;
        case 'e':
          event.preventDefault();
          setActiveTool('eraser');
          break;
      }
    },
    [setActiveTool]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    activeTool,
    toolOptions,
    currentColor,
    currentFontFamily,
    currentFontSize,
    currentStrokeWidth,
    currentOpacity,
    setActiveTool,
    setToolOption,
    setColor,
    setFontFamily,
    setFontSize,
    setStrokeWidth,
    setOpacity,
    resetToolOptions,
  };
}
