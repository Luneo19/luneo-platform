/**
 * @fileoverview Hook pour interagir avec l'Agent Aria
 * @module useAriaChat
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ React Query pour le cache
 * - ✅ Gestion d'erreurs
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/client';
import type { AriaResponse, AriaSuggestion } from '@/types/agents';

// ============================================================================
// TYPES
// ============================================================================

interface UseAriaChatParams {
  productId: string;
  sessionId: string;
}

interface SendMessageParams {
  message: string;
  context?: {
    occasion?: string;
    recipient?: string;
    currentText?: string;
    currentStyle?: {
      font?: string;
      color?: string;
    };
  };
}

interface UseAriaChatReturn {
  sendMessage: (params: SendMessageParams) => Promise<AriaResponse>;
  quickSuggest: (occasion: string) => void;
  improveText: (text: string, style: string) => Promise<{ improved: string; variations: string[] }>;
  suggestions: AriaSuggestion[];
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAriaChat({ productId, sessionId }: UseAriaChatParams): UseAriaChatReturn {
  const queryClient = useQueryClient();
  const [currentOccasion, setCurrentOccasion] = useState<string | null>(null);

  // Query pour les suggestions rapides
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['aria', 'suggestions', productId, currentOccasion],
    queryFn: async () => {
      if (!currentOccasion) return [];
      const response = await endpoints.agents.aria.quickSuggest(productId, currentOccasion);
      return response.data;
    },
    enabled: !!currentOccasion,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: async (params: SendMessageParams): Promise<AriaResponse> => {
      const response = await endpoints.agents.aria.chat({
        sessionId,
        productId,
        message: params.message,
        context: params.context,
      });
      return response.data;
    },
  });

  // Mutation pour améliorer le texte
  const improveTextMutation = useMutation({
    mutationFn: async ({ text, style }: { text: string; style: string }) => {
      const response = await endpoints.agents.aria.improveText({
        text,
        style,
        productId,
      });
      return response.data as { improved: string; variations: string[] };
    },
  });

  // Déclencher les suggestions rapides
  const quickSuggest = useCallback((occasion: string) => {
    setCurrentOccasion(occasion);
  }, []);

  // Améliorer un texte
  const improveText = useCallback(async (text: string, style: string) => {
    return improveTextMutation.mutateAsync({ text, style });
  }, [improveTextMutation]);

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    quickSuggest,
    improveText,
    suggestions: suggestionsData || [],
    isLoading: sendMessageMutation.isPending || isSuggestionsLoading,
    error: sendMessageMutation.error || improveTextMutation.error,
  };
}
