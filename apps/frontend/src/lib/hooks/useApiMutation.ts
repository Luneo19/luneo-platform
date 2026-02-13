'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';

interface ApiError {
  status?: number;
  message: string;
  code?: string;
}

interface MutationOptions<T, V> {
  /**
   * Success message to show in toast
   */
  successMessage?: string | ((data: T) => string);
  
  /**
   * Error message to show in toast (default: shows API error message)
   */
  errorMessage?: string | ((error: ApiError) => string);
  
  /**
   * Callback on success
   */
  onSuccess?: (data: T, variables: V) => void | Promise<void>;
  
  /**
   * Callback on error
   */
  onError?: (error: ApiError, variables: V) => void;
  
  /**
   * Whether to show success toast (default: true if successMessage provided)
   */
  showSuccessToast?: boolean;
  
  /**
   * Whether to show error toast (default: true)
   */
  showErrorToast?: boolean;
  
  /**
   * Custom retry logic
   */
  retry?: number;
  
  /**
   * Delay between retries in ms (default: 1000)
   */
  retryDelay?: number;
}

interface MutationState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface MutationResult<T, V> extends MutationState<T> {
  mutate: (variables: V) => Promise<T | null>;
  mutateAsync: (variables: V) => Promise<T>;
  reset: () => void;
}

/**
 * Hook personnalisé pour les mutations API avec gestion automatique des toasts
 * PHASE 3: Amélioration UX Frontend
 * 
 * @example
 * const { mutate, isLoading } = useApiMutation(
 *   (data: CreateProductDto) => endpoints.products.create(data),
 *   {
 *     successMessage: 'Produit créé avec succès',
 *     onSuccess: (data) => router.push(`/products/${data.id}`),
 *   }
 * );
 */
export function useApiMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options: MutationOptions<T, V> = {}
): MutationResult<T, V> {
  const { toast } = useToast();
  const { t } = useI18n();
  const [state, setState] = useState<MutationState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    showSuccessToast = !!successMessage,
    showErrorToast = true,
    retry = 0,
    retryDelay = 1000,
  } = options;

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  const parseError = useCallback((error: unknown): ApiError => {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      const response = err.response as { status?: number; statusText?: string; data?: { message?: string; code?: string } } | undefined;
      const data = response?.data;

      // Axios error
      if (response) {
        return {
          status: response.status,
          message: (data?.message as string) || response.statusText || 'Une erreur est survenue',
          code: data?.code,
        };
      }

      // Network error
      if (err.request) {
        return {
          status: 0,
          message: 'Erreur réseau - vérifiez votre connexion',
          code: 'NETWORK_ERROR',
        };
      }

      // Standard error
      if (typeof err.message === 'string') {
        return {
          message: err.message,
          code: err.code as string | undefined,
        };
      }
    }

    return { message: 'Une erreur inattendue est survenue' };
  }, []);

  const executeWithRetry = useCallback(async (
    fn: () => Promise<T>,
    retriesLeft: number
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retriesLeft > 0) {
        logger.warn(`Mutation failed, retrying... (${retriesLeft} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return executeWithRetry(fn, retriesLeft - 1);
      }
      throw error;
    }
  }, [retryDelay]);

  const mutateAsync = useCallback(async (variables: V): Promise<T> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
    }));

    try {
      const data = await executeWithRetry(() => mutationFn(variables), retry);

      setState({
        data,
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
      });

      // Show success toast
      if (showSuccessToast && successMessage) {
        const message = typeof successMessage === 'function' 
          ? successMessage(data) 
          : successMessage;
        
        toast({
          title: t('common.success'),
          description: message,
          // Use default variant for success (green styling via CSS)
        });
      }

      // Call success callback
      await onSuccess?.(data, variables);

      return data;
    } catch (error) {
      const apiError = parseError(error);

      setState({
        data: null,
        error: apiError,
        isLoading: false,
        isSuccess: false,
        isError: true,
      });

      // Log error
      logger.error('Mutation error', { error: apiError, variables });

      // Show error toast
      if (showErrorToast) {
        const message = errorMessage
          ? (typeof errorMessage === 'function' ? errorMessage(apiError) : errorMessage)
          : apiError.message;

        toast({
          title: t('common.error'),
          description: message,
          variant: 'destructive',
        });
      }

      // Call error callback
      onError?.(apiError, variables);

      throw error;
    }
  }, [
    mutationFn,
    executeWithRetry,
    retry,
    parseError,
    showSuccessToast,
    successMessage,
    showErrorToast,
    errorMessage,
    onSuccess,
    onError,
    toast,
    t,
  ]);

  const mutate = useCallback(async (variables: V): Promise<T | null> => {
    try {
      return await mutateAsync(variables);
    } catch {
      return null;
    }
  }, [mutateAsync]);

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  };
}

/**
 * Hook pour les mutations optimistes (avec rollback automatique)
 */
export function useOptimisticMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: MutationOptions<T, V> & {
    /**
     * Function to get current data before mutation
     */
    getCurrentData: () => T | null;
    /**
     * Function to optimistically update data
     */
    setOptimisticData: (data: T | ((prev: T | null) => T | null)) => void;
  }
): MutationResult<T, V> {
  const { getCurrentData, setOptimisticData, ...mutationOptions } = options;

  return useApiMutation<T, V>(mutationFn, {
    ...mutationOptions,
    onError: (error, variables) => {
      // Rollback on error
      const previousData = getCurrentData();
      if (previousData) {
        setOptimisticData(previousData);
      }
      mutationOptions.onError?.(error, variables);
    },
  });
}

export default useApiMutation;
