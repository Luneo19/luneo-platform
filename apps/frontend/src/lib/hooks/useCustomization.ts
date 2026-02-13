/**
 * ★★★ HOOK - USE CUSTOMIZATION ★★★
 * Hook personnalisé pour gérer les personnalisations
 * - Génération depuis prompt
 * - Polling status
 * - Gestion cache
 * - Optimistic updates
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { validatePrompt, sanitizePrompt } from '@/lib/utils/customization';
import type { CustomizationOptions } from '@/lib/utils/customization';

// ========================================
// TYPES
// ========================================

export interface UseCustomizationOptions {
  productId: string;
  zoneId: string;
  autoPoll?: boolean;
  pollInterval?: number;
  onSuccess?: (customizationId: string, previewUrl: string, modelUrl: string) => void;
  onError?: (error: string) => void;
}

export interface CustomizationState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  customizationId: string | null;
  previewUrl: string | null;
  modelUrl: string | null;
  error: string | null;
  progress: number;
}

// ========================================
// HOOK
// ========================================

export function useCustomization(options: UseCustomizationOptions) {
  const { productId, zoneId, autoPoll = true, pollInterval = 2000, onSuccess, onError } = options;

  const [state, setState] = useState<CustomizationState>({
    status: 'idle',
    customizationId: null,
    previewUrl: null,
    modelUrl: null,
    error: null,
    progress: 0,
  });

  // Mutations
  const generateMutation = trpc.customization.generateFromPrompt.useMutation();
  const checkStatusQuery = trpc.customization.checkStatus.useQuery(
    { id: state.customizationId! },
    {
      enabled: state.status === 'generating' && !!state.customizationId && autoPoll,
      refetchInterval: pollInterval,
    }
  );

  // ========================================
  // EFFECTS
  // ========================================

  // Poll status when generating
  useEffect(() => {
    if (state.status === 'generating' && checkStatusQuery.data) {
      const status = checkStatusQuery.data.status;

      if (status === 'COMPLETED') {
        setState({
          status: 'completed',
          customizationId: checkStatusQuery.data.id,
          previewUrl: checkStatusQuery.data.previewUrl || null,
          modelUrl: checkStatusQuery.data.modelUrl || null,
          error: null,
          progress: 100,
        });

        if (checkStatusQuery.data.previewUrl && checkStatusQuery.data.modelUrl) {
          onSuccess?.(
            checkStatusQuery.data.id,
            checkStatusQuery.data.previewUrl,
            checkStatusQuery.data.modelUrl
          );
        }
      } else if (status === 'FAILED') {
        const errorMessage = checkStatusQuery.data.errorMessage || 'Erreur lors de la génération';
        setState({
          status: 'error',
          customizationId: state.customizationId,
          previewUrl: null,
          modelUrl: null,
          error: errorMessage,
          progress: 0,
        });
        onError?.(errorMessage);
      } else if (status === 'GENERATING') {
        // Update progress (estimate)
        setState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }
    }
  }, [checkStatusQuery.data, state.status, state.customizationId, onSuccess, onError]);

  // ========================================
  // FUNCTIONS
  // ========================================

  const generate = useCallback(
    async (prompt: string, customizationOptions?: CustomizationOptions) => {
      // Validate prompt
      const validation = validatePrompt(prompt);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        setState({
          status: 'error',
          customizationId: null,
          previewUrl: null,
          modelUrl: null,
          error: errorMessage,
          progress: 0,
        });
        onError?.(errorMessage);
        return;
      }

      // Sanitize prompt
      const sanitized = sanitizePrompt(prompt);

      // Reset state
      setState({
        status: 'generating',
        customizationId: null,
        previewUrl: null,
        modelUrl: null,
        error: null,
        progress: 10,
      });

      try {
        const result = await generateMutation.mutateAsync({
          productId,
          zoneId,
          prompt: sanitized,
          ...customizationOptions,
        });

        setState({
          status: 'generating',
          customizationId: result.id,
          previewUrl: null,
          modelUrl: null,
          error: null,
          progress: 20,
        });

        logger.info('Customization generation started', { customizationId: result.id });
      } catch (error: unknown) {
        const errorMessage = getErrorDisplayMessage(error);
        setState({
          status: 'error',
          customizationId: null,
          previewUrl: null,
          modelUrl: null,
          error: errorMessage,
          progress: 0,
        });
        onError?.(errorMessage);
        logger.error('Error generating customization', { error });
      }
    },
    [productId, zoneId, generateMutation, onError]
  );

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      customizationId: null,
      previewUrl: null,
      modelUrl: null,
      error: null,
      progress: 0,
    });
  }, []);

  // ========================================
  // COMPUTED
  // ========================================

  const isGenerating = useMemo(() => state.status === 'generating', [state.status]);
  const isCompleted = useMemo(() => state.status === 'completed', [state.status]);
  const hasError = useMemo(() => state.status === 'error', [state.status]);

  // ========================================
  // RETURN
  // ========================================

  return {
    // State
    ...state,
    isGenerating,
    isCompleted,
    hasError,

    // Actions
    generate,
    reset,

    // Utils
    isLoading: generateMutation.isPending,
  };
}

