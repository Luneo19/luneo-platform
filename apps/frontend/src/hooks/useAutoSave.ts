'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay: number;
  enabled: boolean;
}

export function useAutoSave<T>({ data, onSave, delay, enabled }: UseAutoSaveOptions<T>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const save = useCallback(async () => {
    try {
      await onSave(dataRef.current);
    } catch {
      // Silent fail for auto-save
    }
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, enabled, save]);
}
