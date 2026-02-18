/**
 * Hook for AR object placement
 */

'use client';

import { useState, useCallback, useRef } from 'react';

export interface PlacementTransform {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
}

const defaultTransform: PlacementTransform = {
  x: 0,
  y: 0,
  z: 0,
  scale: 1,
  rotationY: 0,
};

export interface UseARPlacementOptions {
  initialTransform?: Partial<PlacementTransform>;
  onPlace?: (transform: PlacementTransform) => void;
  onRemove?: () => void;
}

export function useARPlacement(options: UseARPlacementOptions = {}) {
  const [transform, setTransform] = useState<PlacementTransform>({
    ...defaultTransform,
    ...options.initialTransform,
  });
  const [isPlaced, setIsPlaced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const placementRef = useRef<HTMLElement | null>(null);

  const place = useCallback(
    (t?: Partial<PlacementTransform>) => {
      const next = { ...transform, ...t };
      setTransform(next);
      setIsPlaced(true);
      options.onPlace?.(next);
    },
    [transform, options.onPlace]
  );

  const updateTransform = useCallback((updates: Partial<PlacementTransform>) => {
    setTransform((prev) => ({ ...prev, ...updates }));
  }, []);

  const remove = useCallback(() => {
    setIsPlaced(false);
    setTransform({ ...defaultTransform });
    options.onRemove?.();
  }, [options.onRemove]);

  const startDrag = useCallback(() => setIsDragging(true), []);
  const endDrag = useCallback(() => setIsDragging(false), []);

  return {
    transform,
    isPlaced,
    isDragging,
    placementRef,
    place,
    updateTransform,
    remove,
    startDrag,
    endDrag,
    reset: () => setTransform({ ...defaultTransform }),
  };
}
