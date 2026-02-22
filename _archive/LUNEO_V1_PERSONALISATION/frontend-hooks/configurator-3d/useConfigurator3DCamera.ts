/**
 * useConfigurator3DCamera - Camera control
 * focusOnComponent, resetCamera, zoomIn, zoomOut
 */

import { useCallback } from 'react';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';

export interface UseConfigurator3DCameraReturn {
  cameraPosition: { x: number; y: number; z: number } | null;
  cameraTarget: { x: number; y: number; z: number } | null;
  focusOnComponent: (componentId: string) => void;
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setCameraPosition: (pos: { x: number; y: number; z: number } | null) => void;
  setCameraTarget: (target: { x: number; y: number; z: number } | null) => void;
}

const ZOOM_STEP = 0.1;

export function useConfigurator3DCamera(): UseConfigurator3DCameraReturn {
  const cameraPosition = useConfigurator3DStore((s) => s.scene.cameraPosition);
  const cameraTarget = useConfigurator3DStore((s) => s.scene.cameraTarget);
  const zoom = useConfigurator3DStore((s) => s.ui.zoom);
  const configuration = useConfigurator3DStore((s) => s.configuration);

  const focusOnComponent = useCallback((componentId: string) => {
    useConfigurator3DStore.getState().focusOnComponent(componentId);
  }, []);

  const resetCamera = useCallback(() => {
    const config = useConfigurator3DStore.getState().configuration;
    const camSettings = config?.cameraSettings;
    if (camSettings?.initialPosition) {
      useConfigurator3DStore.getState().setCameraPosition(camSettings.initialPosition as { x: number; y: number; z: number });
    }
    if (camSettings?.initialTarget) {
      useConfigurator3DStore.getState().setCameraTarget(camSettings.initialTarget as { x: number; y: number; z: number });
    }
    useConfigurator3DStore.getState().setZoom(1);
  }, []);

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(3, zoom + ZOOM_STEP);
    useConfigurator3DStore.getState().setZoom(newZoom);
  }, [zoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(0.3, zoom - ZOOM_STEP);
    useConfigurator3DStore.getState().setZoom(newZoom);
  }, [zoom]);

  const setCameraPosition = useCallback((pos: { x: number; y: number; z: number } | null) => {
    useConfigurator3DStore.getState().setCameraPosition(pos);
  }, []);

  const setCameraTarget = useCallback((target: { x: number; y: number; z: number } | null) => {
    useConfigurator3DStore.getState().setCameraTarget(target);
  }, []);

  return {
    cameraPosition,
    cameraTarget,
    focusOnComponent,
    resetCamera,
    zoomIn,
    zoomOut,
    setCameraPosition,
    setCameraTarget,
  };
}