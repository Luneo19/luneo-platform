'use client';

import { useState, useCallback, useEffect } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AgentConversation, AgentMessage } from '@/types/agents';

interface UseConversationOptions {
  conversationId?: string;
  agentType?: 'luna' | 'aria' | 'nova';
  autoLoad?: boolean;
}

interface UseConversationReturn {
  conversation: AgentConversation | null;
  messages: AgentMessage[];
  isLoading: boolean;
  error: Error | null;
  addOptimisticMessage: (role: 'user' | 'assistant', content: string) => void;
  updateLastMessage: (content: string) => void;
  loadConversation: (id: string) => Promise<void>;
  loadConversations: () => Promise<AgentConversation[]>;
  refresh: () => Promise<void>;
}

export function useConversation(options: UseConversationOptions = {}): UseConversationReturn {
  const [conversation, setConversation] = useState<AgentConversation | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await endpoints.agents.conversation(id);
      if (response.success) {
        setConversation(response.data);
        setMessages(response.data.messages || []);
      }
    } catch (err) {
      logger.error('Failed to load conversation', { error: err });
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async (): Promise<AgentConversation[]> => {
    try {
      const response = await endpoints.agents.conversations(options.agentType);
      if (response.success) {
        return response.data.conversations;
      }
      return [];
    } catch (err) {
      logger.error('Failed to load conversations', { error: err });
      return [];
    }
  }, [options.agentType]);

  const addOptimisticMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      const optimisticMessage: AgentMessage = {
        id: `temp-${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
    },
    [],
  );

  const updateLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content,
      };
      return updated;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (conversation?.id) {
      await loadConversation(conversation.id);
    }
  }, [conversation?.id, loadConversation]);

  useEffect(() => {
    if (options.autoLoad && options.conversationId) {
      loadConversation(options.conversationId);
    }
  }, [options.autoLoad, options.conversationId, loadConversation]);

  return {
    conversation,
    messages,
    isLoading,
    error,
    addOptimisticMessage,
    updateLastMessage,
    loadConversation,
    loadConversations,
    refresh,
  };
}
