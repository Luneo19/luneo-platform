'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFeatureFlag } from '@/contexts/FeatureFlagContext';

const STORAGE_KEY = 'luneo-demo-mode';

interface UseDemoModeResult {
  isDemoMode: boolean;
  isAvailable: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
}

export function useDemoMode(): UseDemoModeResult {
  const featureEnabled = useFeatureFlag('demo_mode', false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (!featureEnabled) {
      setIsDemoMode(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const urlParam = url.searchParams.get('demo');
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const shouldEnable = urlParam === '1' || stored === '1';

    setIsDemoMode(shouldEnable);
    updateUrl(url, shouldEnable);
    persistState(shouldEnable);
  }, [featureEnabled]);

  const setDemoState = useCallback((enabled: boolean) => {
    if (!featureEnabled || typeof window === 'undefined') {
      return;
    }
    setIsDemoMode(enabled);
    persistState(enabled);
    const url = new URL(window.location.href);
    updateUrl(url, enabled);
  }, [featureEnabled]);

  return {
    isDemoMode,
    isAvailable: featureEnabled,
    enableDemo: () => setDemoState(true),
    disableDemo: () => setDemoState(false),
  };
}

function persistState(enabled: boolean) {
  if (typeof window === 'undefined') return;
  if (enabled) {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function updateUrl(url: URL, enabled: boolean) {
  if (typeof window === 'undefined') return;
  if (enabled) {
    url.searchParams.set('demo', '1');
  } else {
    url.searchParams.delete('demo');
  }
  window.history.replaceState({}, '', url.toString());
}

