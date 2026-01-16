/**
 * @fileoverview Hook pour interagir avec l'Agent Nova (Support)
 * @module useNovaChat
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ React Query pour la mutation
 * - ✅ Gestion d'erreurs
 */

import { useMutation } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import type { NovaResponse } from '@/types/agents';

// ============================================================================
// TYPES
// ============================================================================

interface NovaContext {
  currentPage?: string;
  locale?: string;
  subscriptionPlan?: string;
  orderId?: string;
  integration?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

interface SendNovaMessageParams {
  message: string;
  brandId?: string;
  userId?: string;
  context?: NovaContext;
}

interface UseNovaChatReturn {
  sendMessage: (params: SendNovaMessageParams) => Promise<NovaResponse>;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useNovaChat(): UseNovaChatReturn {
  const sendMessageMutation = useMutation({
    mutationFn: async (params: SendNovaMessageParams): Promise<NovaResponse> => {
      const response = await endpoints.agents.nova.chat(params);
      return response.data;
    },
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error as Error | null,
  };
}

