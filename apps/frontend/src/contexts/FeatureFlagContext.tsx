'use client';

import { createContext, useContext, useMemo } from 'react';

export interface FeatureFlagContextValue {
  flags: Record<string, boolean>;
  updatedAt: string | null;
  isEnabled: (flag: string, fallback?: boolean) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

interface FeatureFlagProviderProps {
  flags: Record<string, boolean>;
  updatedAt: string | null;
  children: React.ReactNode;
}

export function FeatureFlagProvider({ flags, updatedAt, children }: FeatureFlagProviderProps) {
  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      updatedAt,
      isEnabled: (flag: string, fallback = false) =>
        Object.prototype.hasOwnProperty.call(flags, flag) ? Boolean(flags[flag]) : fallback,
    }),
    [flags, updatedAt],
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

export function useFeatureFlag(flag: string, fallback = false): boolean {
  const context = useFeatureFlags();
  return context.isEnabled(flag, fallback);
}

