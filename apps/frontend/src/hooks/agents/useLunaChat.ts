/**
 * @fileoverview Hook pour interagir avec l'Agent Luna
 * @module useLunaChat
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 * - ✅ React Query pour le cache
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import type { LunaResponse, LunaAction } from '@/types/agents';

// ============================================================================
// TYPES
// ============================================================================

interface SendMessageParams {
  message: string;
  conversationId?: string;
  context?: {
    currentPage?: string;
    selectedProductId?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  };
}

interface UseLunaChatReturn {
  sendMessage: (params: SendMessageParams) => Promise<LunaResponse>;
  executeAction: (action: LunaAction) => Promise<unknown>;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useLunaChat(): UseLunaChatReturn {
  const queryClient = useQueryClient();

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: async (params: SendMessageParams): Promise<LunaResponse> => {
      const response = await endpoints.agents.luna.chat(params);
      return response.data;
    },
    onSuccess: () => {
      // Invalider les queries liées aux analytics si nécessaire
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Mutation pour exécuter une action
  const executeActionMutation = useMutation({
    mutationFn: async (action: LunaAction): Promise<unknown> => {
      const response = await endpoints.agents.luna.action({ action });
      return response.data;
    },
    onSuccess: (_, action) => {
      // Invalider les queries appropriées selon le type d'action
      if (action.type === 'create_product' || action.type === 'update_product') {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
      if (action.type === 'generate_report') {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
      }
    },
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    executeAction: executeActionMutation.mutateAsync,
    isLoading: sendMessageMutation.isPending || executeActionMutation.isPending,
    error: sendMessageMutation.error || executeActionMutation.error,
  };
}
