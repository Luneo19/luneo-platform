/**
 * useRealtime Hook
 * A-010: Hook pour les mises à jour en temps réel via SSE
 * 
 * Usage:
 * const { isConnected, lastEvent, subscribe } = useRealtime();
 * 
 * useEffect(() => {
 *   const unsubscribe = subscribe('metrics_update', (data) => {
 *     logger.info('New metrics:', data);
 *   });
 *   return unsubscribe;
 * }, [subscribe]);
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '@/lib/logger';
import type {
  RealtimeEvent,
  RealtimeEventType,
  ConnectionState,
  RealtimeConfig,
} from './types';

const DEFAULT_CONFIG: RealtimeConfig = {
  enabled: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  channels: ['default'],
};

type EventCallback<T = unknown> = (data: T, event: RealtimeEvent<T>) => void;

interface UseRealtimeOptions {
  config?: Partial<RealtimeConfig>;
  autoConnect?: boolean;
  channels?: string[];
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { config: userConfig, autoConnect = true, channels = ['default'] } = options;
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    lastEventTime: null,
    reconnectAttempts: 0,
    error: null,
  });
  
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const subscribersRef = useRef<Map<RealtimeEventType, Set<EventCallback>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!config.enabled || typeof window === 'undefined') return;
    
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const channelParam = channels.join(',');
    const url = `/api/realtime/events?channels=${channelParam}`;
    
    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        logger.info('SSE connected');
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          reconnectAttempts: 0,
        }));
        startHeartbeat();
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedEvent: RealtimeEvent = JSON.parse(event.data);
          
          setLastEvent(parsedEvent);
          setConnectionState(prev => ({
            ...prev,
            lastEventTime: Date.now(),
          }));

          // Notify subscribers
          const callbacks = subscribersRef.current.get(parsedEvent.type);
          if (callbacks) {
            callbacks.forEach(callback => {
              try {
                callback(parsedEvent.data, parsedEvent);
              } catch (err) {
                logger.error('Error in realtime subscriber', { error: err });
              }
            });
          }

          // Also notify wildcard subscribers
          const wildcardCallbacks = subscribersRef.current.get('*' as RealtimeEventType);
          if (wildcardCallbacks) {
            wildcardCallbacks.forEach(callback => {
              try {
                callback(parsedEvent.data, parsedEvent);
              } catch (err) {
                logger.error('Error in wildcard subscriber', { error: err });
              }
            });
          }
        } catch (err) {
          logger.warn('Failed to parse SSE event', { error: err, data: event.data });
        }
      };

      eventSource.onerror = () => {
        logger.warn('SSE connection error');
        eventSource.close();
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          error: 'Connection lost',
        }));
        scheduleReconnect();
      };
    } catch (err) {
      logger.error('Failed to create EventSource', { error: err });
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        error: 'Failed to connect',
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enabled, channels]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    setConnectionState(prev => ({
      ...prev,
      isConnected: false,
    }));
  }, []);

  // Schedule reconnect
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionState(prev => {
      if (prev.reconnectAttempts >= config.maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached');
        return { ...prev, error: 'Max reconnection attempts reached' };
      }

      const delay = config.reconnectInterval * Math.pow(2, prev.reconnectAttempts);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);

      return {
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1,
      };
    });
  }, [config.reconnectInterval, config.maxReconnectAttempts, connect]);

  // Heartbeat check
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      // Check if we've received events recently
      const now = Date.now();
      const lastEvent = connectionState.lastEventTime;
      
      if (lastEvent && now - lastEvent > config.heartbeatInterval * 2) {
        logger.warn('Heartbeat timeout, reconnecting');
        disconnect();
        connect();
      } else {
        startHeartbeat();
      }
    }, config.heartbeatInterval);
  }, [config.heartbeatInterval, connectionState.lastEventTime, disconnect, connect]);

  // Subscribe to events
  const subscribe = useCallback(<T = unknown>(
    eventType: RealtimeEventType | '*',
    callback: EventCallback<T>
  ): () => void => {
    const type = eventType as RealtimeEventType;
    
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    
    subscribersRef.current.get(type)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      const callbacks = subscribersRef.current.get(type);
      if (callbacks) {
        callbacks.delete(callback as EventCallback);
        if (callbacks.size === 0) {
          subscribersRef.current.delete(type);
        }
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Reconnect on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connectionState.isConnected) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, connectionState.isConnected]);

  return {
    // State
    isConnected: connectionState.isConnected,
    lastEvent,
    lastEventTime: connectionState.lastEventTime,
    error: connectionState.error,
    reconnectAttempts: connectionState.reconnectAttempts,
    
    // Actions
    connect,
    disconnect,
    subscribe,
  };
}

export default useRealtime;


