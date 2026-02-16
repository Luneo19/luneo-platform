'use client';

/**
 * useErrorToast - Hook centralisé pour afficher des erreurs user-friendly
 * Remplace les `error.message` bruts par des messages traduits et sécurisés.
 */
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { classifyError, getUserFriendlyMessage, createErrorMessage } from '@/lib/utils/error-handler';
import { logger } from '@/lib/logger';

/**
 * Convertit une erreur en message user-friendly (utilitaire standalone)
 */
export function getErrorDisplayMessage(error: unknown): string {
  const appError = classifyError(error);
  return getUserFriendlyMessage(appError);
}

/**
 * Hook pour afficher des erreurs via toast avec messages user-friendly
 */
export function useErrorToast() {
  const { toast } = useToast();

  const showError = useCallback(
    (error: unknown, context?: string) => {
      const appError = classifyError(error);
      const errorInfo = createErrorMessage(appError);

      logger.error(context || 'Error occurred', {
        type: appError.type,
        code: appError.code,
        statusCode: appError.statusCode,
        context,
      });

      toast({
        variant: 'destructive',
        title: errorInfo.title,
        description: errorInfo.message,
      });

      return appError;
    },
    [toast],
  );

  return { showError, getErrorDisplayMessage };
}
