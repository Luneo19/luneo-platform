/**
 * useConfigurator3DSession - Session lifecycle
 * Auto-update session on selection changes (debounced)
 * Handle session expiry
 */

import { useEffect, useCallback, useRef } from 'react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import type { DeviceInfo } from '@/lib/configurator-3d/types/configurator.types';

const SESSION_UPDATE_DEBOUNCE_MS = 2000;

export type SessionStatus = 'ACTIVE' | 'SAVED' | 'COMPLETED' | 'ABANDONED' | 'CONVERTED' | 'EXPIRED';

export interface UseConfigurator3DSessionReturn {
  sessionId: string | null;
  sessionStatus: SessionStatus | null;
  startSession: (configId: string, deviceInfo?: DeviceInfo) => Promise<void>;
  updateSession: (selections?: Record<string, string | string[]>, previewImageUrl?: string) => Promise<void>;
  completeSession: () => Promise<void>;
  saveSession: (name?: string, description?: string) => Promise<{ id: string } | null>;
  addToCart: () => Promise<{ success: boolean; error?: string }>;
}

export function useConfigurator3DSession(configurationId: string | null): UseConfigurator3DSessionReturn {
  const sessionId = useConfigurator3DStore((s) => s.sessionId);
  const selections = useConfigurator3DStore((s) => s.selections);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSession = useCallback(async (configId: string, deviceInfo?: DeviceInfo) => {
    try {
      const res = await configurator3dEndpoints.sessions.start({
        configurationId: configId,
        deviceInfo,
      });
      const sid = (res as { sessionId?: string; id?: string }).sessionId ?? (res as { id?: string }).id;
      if (sid) {
        useConfigurator3DStore.setState({ sessionId: sid });
      }
    } catch {
      // Session start failure - non-blocking
    }
  }, []);

  const updateSession = useCallback(
    async (sel?: Record<string, string | string[]>, previewImageUrl?: string) => {
      if (!sessionId) return;
      try {
        await configurator3dEndpoints.sessions.update(sessionId, {
          selections: sel ?? selections,
          previewImageUrl,
        });
      } catch {
        // Session update failure - non-blocking
      }
    },
    [sessionId, selections]
  );

  useEffect(() => {
    if (!sessionId || !configurationId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      updateSession(selections);
    }, SESSION_UPDATE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sessionId, configurationId, selections, updateSession]);

  const completeSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await configurator3dEndpoints.sessions.complete(sessionId);
    } catch {
      // Non-blocking
    }
  }, [sessionId]);

  const saveSession = useCallback(
    async (name?: string, description?: string): Promise<{ id: string } | null> => {
      if (!sessionId) return null;
      try {
        const res = await configurator3dEndpoints.sessions.save(sessionId, { name, description });
        return res as { id: string };
      } catch {
        return null;
      }
    },
    [sessionId]
  );

  const addToCart = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return useConfigurator3DStore.getState().addToCart();
  }, []);

  return {
    sessionId,
    sessionStatus: sessionId ? 'ACTIVE' : null,
    startSession,
    updateSession,
    completeSession,
    saveSession,
    addToCart,
  };
}