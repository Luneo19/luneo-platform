/**
 * useSession
 * Session management hook with auto-save functionality
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '@/stores/customizer';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';

interface UseSessionOptions {
  customizerId: string;
  autoSaveInterval?: number; // milliseconds
}

interface UseSessionReturn {
  sessionId: string | null;
  sessionStatus: ReturnType<typeof useSessionStore.getState>['sessionStatus'];
  startSession: (customizerId: string) => Promise<void>;
  saveDesign: (name: string, canvasData?: Record<string, unknown>) => Promise<unknown>;
  autoSave: () => Promise<void>;
  endSession: () => void;
  lastSavedAt: Date | null;
  isDirty: boolean;
}

/**
 * Session management hook with auto-save
 */
export function useSession(options: UseSessionOptions): UseSessionReturn {
  const { customizerId, autoSaveInterval = 30000 } = options;

  const sessionId = useSessionStore((state) => state.sessionId);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const isDirty = useSessionStore((state) => state.isDirty);
  const lastSavedAt = useSessionStore((state) => state.lastSavedAt);
  const startSessionStore = useSessionStore((state) => state.startSession);
  const endSessionStore = useSessionStore((state) => state.endSession);
  const markClean = useSessionStore((state) => state.markClean);
  const setLastSaved = useSessionStore((state) => state.setLastSaved);

  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const utils = trpc.useUtils();

  // Start session mutation
  const startSessionMutation = trpc.visualCustomizer.sessions.startSession.useMutation({
    onSuccess: (data) => {
      logger.info('useSession: session started', { sessionId: (data as { id: string }).id });
    },
    onError: (error) => {
      logger.error('useSession: startSession failed', { error });
    },
  });

  // Update session mutation
  const updateSessionMutation = trpc.visualCustomizer.sessions.updateSession.useMutation({
    onSuccess: () => {
      markClean();
      setLastSaved(new Date());
      logger.info('useSession: session updated');
    },
    onError: (error) => {
      logger.error('useSession: updateSession failed', { error });
    },
  });

  // Save design mutation
  const saveDesignMutation = trpc.visualCustomizer.sessions.saveDesign.useMutation({
    onSuccess: () => {
      markClean();
      setLastSaved(new Date());
      logger.info('useSession: design saved');
    },
    onError: (error) => {
      logger.error('useSession: saveDesign failed', { error });
    },
  });

  const startSession = useCallback(
    async (customizerIdParam: string): Promise<void> => {
      try {
        const result = await startSessionMutation.mutateAsync({
          customizerId: customizerIdParam,
        });

        const sessionIdFromServer = (result as { id: string }).id;
        startSessionStore(customizerIdParam);

        // Start auto-save interval
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }

        autoSaveIntervalRef.current = setInterval(() => {
          if (isDirty && sessionIdFromServer) {
            autoSave();
          }
        }, autoSaveInterval);
      } catch (error) {
        logger.error('useSession: startSession failed', { error });
        throw error;
      }
    },
    [startSessionMutation, startSessionStore, isDirty, autoSaveInterval]
  );

  const autoSave = useCallback(async (): Promise<void> => {
    if (!sessionId || !isDirty) {
      return;
    }

    try {
      // Get canvas data from store or context
      const canvasData: Record<string, unknown> = {}; // This would come from canvas state

      await updateSessionMutation.mutateAsync({
        id: sessionId,
        canvasData,
      });
    } catch (error) {
      logger.error('useSession: autoSave failed', { error });
    }
  }, [sessionId, isDirty, updateSessionMutation]);

  const saveDesign = useCallback(
    async (name: string, canvasData?: Record<string, unknown>): Promise<unknown> => {
      const currentSessionId = sessionId || '';
      if (!currentSessionId) {
        throw new Error('Session not started');
      }

      const data = canvasData || {}; // Get from canvas state if not provided

      return saveDesignMutation.mutateAsync({
        sessionId: currentSessionId,
        name,
        canvasData: data,
      });
    },
    [sessionId, saveDesignMutation]
  );

  const endSession = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }

    endSessionStore();
    logger.info('useSession: session ended');
  }, [endSessionStore]);

  // Initialize session on mount
  useEffect(() => {
    if (customizerId && !sessionId) {
      startSession(customizerId);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [customizerId, sessionId, startSession]);

  return {
    sessionId,
    sessionStatus,
    startSession,
    saveDesign,
    autoSave,
    endSession,
    lastSavedAt,
    isDirty,
  };
}
