'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

const STORAGE_PREFIX = 'customizer_backup_';
const DEFAULT_DEBOUNCE_MS = 2000;

export interface AutoSaveOptions {
  sessionId: string | null;
  canvasData: unknown;
  debounceMs?: number;
  enabled?: boolean;
}

export interface AutoSaveState {
  lastSavedAt: Date | null;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
}

export function useAutoSave(
  options: AutoSaveOptions
): AutoSaveState & { saveNow: () => Promise<void>; recoveryData: unknown } {
  const {
    sessionId,
    canvasData,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    enabled = true,
  } = options;

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [recoveryData, setRecoveryData] = useState<unknown>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const persistToLocalStorage = useCallback((sid: string, data: unknown) => {
    try {
      const key = `${STORAGE_PREFIX}${sid}`;
      const raw = JSON.stringify({ canvasData: data, savedAt: new Date().toISOString() });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, raw);
      }
    } catch (e) {
      logger.warn('useAutoSave: localStorage backup failed', { error: e });
    }
  }, []);

  const performSave = useCallback(async () => {
    if (!sessionId || canvasData === undefined) {
      return;
    }
    const payload = JSON.stringify(canvasData);
    if (lastSavedPayloadRef.current === payload) {
      setIsDirty(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    persistToLocalStorage(sessionId, canvasData);

    try {
      await endpoints.visualCustomizer.sessions.update(sessionId, { canvasData });
      lastSavedPayloadRef.current = payload;
      setLastSavedAt(new Date());
      setIsDirty(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      logger.error('useAutoSave: server save failed', { sessionId, error: message });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [sessionId, canvasData, persistToLocalStorage]);

  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await performSave();
  }, [performSave]);

  // Debounced save when canvasData or sessionId changes
  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled || !sessionId || canvasData === undefined) {
      return;
    }
    setIsDirty(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      performSave();
    }, debounceMs);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [sessionId, canvasData, debounceMs, enabled, performSave]);

  // Crash recovery: read backup from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage || !sessionId) {
      return;
    }
    try {
      const key = `${STORAGE_PREFIX}${sessionId}`;
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { canvasData?: unknown; savedAt?: string };
        if (parsed.canvasData !== undefined) {
          setRecoveryData(parsed.canvasData);
        }
      }
    } catch {
      setRecoveryData(null);
    }
  }, [sessionId]);

  // Clear recovery after first successful server save so we don't keep offering stale backup
  useEffect(() => {
    if (lastSavedAt !== null && recoveryData !== null) {
      setRecoveryData(null);
    }
  }, [lastSavedAt, recoveryData]);

  // Unmount: clear timer
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  return {
    lastSavedAt,
    isSaving,
    error,
    isDirty,
    saveNow,
    recoveryData,
  };
}
