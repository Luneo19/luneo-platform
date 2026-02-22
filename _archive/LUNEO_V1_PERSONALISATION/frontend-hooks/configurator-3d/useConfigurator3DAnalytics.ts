/**
 * useConfigurator3DAnalytics - Interaction tracking
 * Batches interactions (collects for 1s then sends batch)
 * POST to sessions/:id/interactions
 */

import { useCallback, useRef, useEffect } from 'react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';

const BATCH_DELAY_MS = 1000;

interface InteractionEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface UseConfigurator3DAnalyticsReturn {
  trackInteraction: (type: string, data?: Record<string, unknown>) => void;
  trackComponentSelect: (componentId: string) => void;
  trackOptionSelect: (componentId: string, optionId: string) => void;
  trackCameraMove: (position: { x: number; y: number; z: number }) => void;
  trackZoom: (level: number) => void;
  trackReset: () => void;
  trackSave: (designId: string) => void;
  trackShare: (method: string) => void;
  trackAddToCart: () => void;
  flush: () => Promise<void>;
}

export function useConfigurator3DAnalytics(): UseConfigurator3DAnalyticsReturn {
  const sessionId = useConfigurator3DStore((s) => s.sessionId);
  const batchRef = useRef<InteractionEvent[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendBatch = useCallback(async () => {
    if (!sessionId || batchRef.current.length === 0) return;

    const events = [...batchRef.current];
    batchRef.current = [];

    try {
      for (const evt of events) {
        await configurator3dEndpoints.sessions.interaction(sessionId, {
          type: evt.type,
          timestamp: evt.timestamp,
          data: evt.data,
        });
      }
    } catch {
      // Silently fail - analytics should not block UX
    }
  }, [sessionId]);

  const scheduleBatch = useCallback(() => {
    if (timeoutRef.current) return;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      sendBatch();
    }, BATCH_DELAY_MS);
  }, [sendBatch]);

  const trackInteraction = useCallback(
    (type: string, data?: Record<string, unknown>) => {
      if (!sessionId) return;
      batchRef.current.push({ type, timestamp: Date.now(), data });
      scheduleBatch();
    },
    [sessionId, scheduleBatch]
  );

  const trackComponentSelect = useCallback(
    (componentId: string) => {
      trackInteraction('component_select', { componentId });
    },
    [trackInteraction]
  );

  const trackOptionSelect = useCallback(
    (componentId: string, optionId: string) => {
      trackInteraction('option_select', { componentId, optionId });
    },
    [trackInteraction]
  );

  const trackCameraMove = useCallback(
    (position: { x: number; y: number; z: number }) => {
      trackInteraction('camera_move', { position });
    },
    [trackInteraction]
  );

  const trackZoom = useCallback(
    (level: number) => {
      trackInteraction('zoom', { level });
    },
    [trackInteraction]
  );

  const trackReset = useCallback(() => {
    trackInteraction('reset');
  }, [trackInteraction]);

  const trackSave = useCallback(
    (designId: string) => {
      trackInteraction('save', { designId });
    },
    [trackInteraction]
  );

  const trackShare = useCallback(
    (method: string) => {
      trackInteraction('share', { method });
    },
    [trackInteraction]
  );

  const trackAddToCart = useCallback(() => {
    trackInteraction('add_to_cart');
  }, [trackInteraction]);

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await sendBatch();
  }, [sendBatch]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    trackInteraction,
    trackComponentSelect,
    trackOptionSelect,
    trackCameraMove,
    trackZoom,
    trackReset,
    trackSave,
    trackShare,
    trackAddToCart,
    flush,
  };
}