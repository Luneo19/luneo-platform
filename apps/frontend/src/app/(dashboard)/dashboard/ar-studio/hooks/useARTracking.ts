/**
 * Hook for AR tracking state
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export type TrackingQuality = 'none' | 'limited' | 'good';

export interface TrackingState {
  quality: TrackingQuality;
  isTracking: boolean;
  pose: { position: { x: number; y: number; z: number }; orientation: { x: number; y: number; z: number; w: number } } | null;
}

const initialState: TrackingState = {
  quality: 'none',
  isTracking: false,
  pose: null,
};

export interface UseARTrackingOptions {
  onTrackingChange?: (state: TrackingState) => void;
  pollInterval?: number;
}

export function useARTracking(options: UseARTrackingOptions = {}) {
  const [state, setState] = useState<TrackingState>(initialState);

  const updateState = useCallback(
    (updates: Partial<TrackingState>) => {
      setState((prev) => {
        const next = { ...prev, ...updates };
        options.onTrackingChange?.(next);
        return next;
      });
    },
    [options.onTrackingChange]
  );

  const setQuality = useCallback(
    (quality: TrackingQuality) => {
      updateState({
        quality,
        isTracking: quality === 'good' || quality === 'limited',
      });
    },
    [updateState]
  );

  const setPose = useCallback(
    (pose: TrackingState['pose']) => {
      updateState({ pose });
    },
    [updateState]
  );

  useEffect(() => {
    if (options.pollInterval && state.isTracking) {
      const id = setInterval(() => {
        setState((prev) => ({ ...prev }));
      }, options.pollInterval);
      return () => clearInterval(id);
    }
  }, [options.pollInterval, state.isTracking]);

  return {
    ...state,
    setQuality,
    setPose,
    updateState,
    reset: () => setState(initialState),
  };
}
