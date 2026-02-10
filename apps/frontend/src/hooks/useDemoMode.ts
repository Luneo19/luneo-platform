'use client';

/**
 * Demo mode hook - always returns false.
 * Demo mode infrastructure has been removed from production.
 */
interface UseDemoModeResult {
  isDemoMode: boolean;
  isAvailable: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
}

export function useDemoMode(): UseDemoModeResult {
  return {
    isDemoMode: false,
    isAvailable: false,
    enableDemo: () => {},
    disableDemo: () => {},
  };
}

