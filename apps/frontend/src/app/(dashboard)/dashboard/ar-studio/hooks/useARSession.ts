/**
 * Hook for WebXR AR session lifecycle
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export type ARSessionState = 'idle' | 'requesting' | 'active' | 'ended' | 'error';

export interface UseARSessionOptions {
  onSessionStart?: (session: XRSession) => void;
  onSessionEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useARSession(options: UseARSessionOptions = {}) {
  const [state, setState] = useState<ARSessionState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const sessionRef = useRef<XRSession | null>(null);

  const startSession = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.xr) {
      const err = new Error('WebXR not supported');
      setError(err);
      setState('error');
      options.onError?.(err);
      return null;
    }
    setState('requesting');
    setError(null);
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!supported) {
        throw new Error('AR not supported on this device');
      }
      const session = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body },
      });
      sessionRef.current = session;
      setState('active');
      options.onSessionStart?.(session);

      session.addEventListener('end', () => {
        sessionRef.current = null;
        setState('ended');
        options.onSessionEnd?.();
      });

      return session;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setState('error');
      options.onError?.(e);
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.onSessionStart, options.onSessionEnd, options.onError]);

  const endSession = useCallback(async () => {
    const session = sessionRef.current;
    if (session) {
      await session.end();
      sessionRef.current = null;
      setState('ended');
      options.onSessionEnd?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.onSessionEnd]);

  useEffect(() => {
    return () => {
      sessionRef.current?.end().catch(() => {});
    };
  }, []);

  return {
    state,
    error,
    session: sessionRef.current,
    startSession,
    endSession,
    isActive: state === 'active',
  };
}
