/**
 * useCustomizer
 * Main initialization hook for the Visual Customizer
 * Wraps useCustomizerStore and handles initialization lifecycle
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useCustomizerStore } from '@/stores/customizer';
import { logger } from '@/lib/logger';

interface UseCustomizerOptions {
  customizerId: string;
  autoInitialize?: boolean;
}

interface UseCustomizerReturn {
  config: ReturnType<typeof useCustomizerStore.getState>['config'];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  reset: () => void;
}

/**
 * Main hook for customizer initialization and state
 */
export function useCustomizer(options: UseCustomizerOptions): UseCustomizerReturn {
  const { customizerId, autoInitialize = true } = options;

  const config = useCustomizerStore((state) => state.config);
  const isLoading = useCustomizerStore((state) => state.isLoading);
  const error = useCustomizerStore((state) => state.error);
  const isInitialized = useCustomizerStore((state) => state.isInitialized);
  const initialize = useCustomizerStore((state) => state.initialize);
  const reset = useCustomizerStore((state) => state.reset);

  const handleInitialize = useCallback(async () => {
    if (!customizerId) {
      logger.warn('useCustomizer: customizerId is required');
      return;
    }

    try {
      await initialize(customizerId);
    } catch (err) {
      logger.error('useCustomizer: initialization failed', { error: err, customizerId });
    }
  }, [customizerId, initialize]);

  useEffect(() => {
    if (autoInitialize && customizerId && !isInitialized && !isLoading) {
      handleInitialize();
    }
  }, [autoInitialize, customizerId, isInitialized, isLoading, handleInitialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optionally reset on unmount if needed
      // reset();
    };
  }, [reset]);

  return {
    config,
    isLoading,
    error,
    isInitialized,
    initialize: handleInitialize,
    reset,
  };
}
