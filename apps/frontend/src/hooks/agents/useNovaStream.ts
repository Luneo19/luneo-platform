'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import type { NovaStreamChunk } from '@/types/agents';

export interface UseNovaStreamOptions {
  onChunk?: (chunk: NovaStreamChunk) => void;
  onComplete?: (fullContent: string) => void;
  onEscalation?: (escalation: NonNullable<NovaStreamChunk['escalation']>) => void;
  onSource?: (source: NonNullable<NovaStreamChunk['source']>) => void;
  onError?: (error: Error) => void;
}

export function useNovaStream(options: UseNovaStreamOptions = {}) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; url?: string; score?: number }>>([]);
  const [escalation, setEscalation] = useState<NovaStreamChunk['escalation'] | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(
    async (message: string, conversationId?: string, brandId?: string) => {
      if (isStreaming) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setIsStreaming(true);
      setError(null);
      setContent('');
      setSources([]);
      setEscalation(null);

      try {
        const params = new URLSearchParams({ message });
        if (conversationId) params.append('conversationId', conversationId);
        if (brandId) params.append('brandId', brandId);

        const url = `/api/v1/agents/nova/chat/stream?${params.toString()}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const chunk: NovaStreamChunk = JSON.parse(event.data);

            options.onChunk?.(chunk);

            switch (chunk.type) {
              case 'content':
                if (chunk.content) {
                  setContent((prev) => prev + chunk.content);
                }
                break;
              case 'source':
                if (chunk.source) {
                  setSources((prev) => [...prev, chunk.source!]);
                  options.onSource?.(chunk.source);
                }
                break;
              case 'escalation':
                if (chunk.escalation) {
                  setEscalation(chunk.escalation);
                  options.onEscalation?.(chunk.escalation);
                }
                break;
              case 'done':
                eventSource.close();
                setIsStreaming(false);
                options.onComplete?.(content + (chunk.content || ''));
                break;
              case 'error':
                eventSource.close();
                setIsStreaming(false);
                const err = new Error(chunk.error || 'Stream error');
                setError(err);
                options.onError?.(err);
                break;
            }
          } catch (err) {
            logger.error('Failed to parse Nova SSE chunk', { error: err });
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setIsStreaming(false);
          const err = new Error('Nova stream connection failed');
          setError(err);
          options.onError?.(err);
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

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return {
    content,
    isStreaming,
    error,
    sources,
    escalation,
    startStream,
    stopStream,
  };
}
