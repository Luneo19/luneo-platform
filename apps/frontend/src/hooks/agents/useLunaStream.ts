/**
 * Hook React pour streaming Luna avec SSE
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface UseLunaStreamOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function useLunaStream(options: UseLunaStreamOptions = {}) {
  const [content, setContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(
    async (message: string, conversationId?: string) => {
      if (isStreaming) {
        logger.warn('Stream already in progress');
        return;
      }

      // Fermer connexion existante
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsStreaming(true);
      setError(null);
      setContent('');

      try {
        // Construire URL SSE
        const params = new URLSearchParams({
          message,
        });
        if (conversationId) {
          params.append('conversationId', conversationId);
        }

        const url = `/api/agents/luna/chat/stream?${params.toString()}`;
        const eventSource = new EventSource(url);

        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const chunk: StreamChunk = JSON.parse(event.data);

            if (chunk.content) {
              setContent((prev) => prev + chunk.content);
              options.onChunk?.(chunk);
            }

            if (chunk.done) {
              eventSource.close();
              setIsStreaming(false);
              options.onComplete?.(content + chunk.content);
            }
          } catch (err) {
            logger.error('Failed to parse SSE chunk', { error: err });
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        };

        eventSource.onerror = (err) => {
          logger.error('SSE connection error', { error: err });
          eventSource.close();
          setIsStreaming(false);
          const error = new Error('Stream connection failed');
          setError(error);
          options.onError?.(error);
        };
      } catch (err) {
        setIsStreaming(false);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      }
    },
    [isStreaming, content, options],
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    content,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
}
