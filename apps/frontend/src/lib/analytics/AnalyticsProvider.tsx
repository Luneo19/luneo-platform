/**
 * Analytics Provider
 * A-006: Context React pour le tracking analytics
 */

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { analytics } from './AnalyticsService';
import type { UserProperties } from './types';

interface AnalyticsContextValue {
  isReady: boolean;
  identify: (user: UserProperties) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  user?: UserProperties | null;
}

export function AnalyticsProvider({ children, user }: AnalyticsProviderProps) {
  const [isReady, setIsReady] = React.useState(false);

  // Initialize analytics
  useEffect(() => {
    analytics.init();
    setIsReady(true);
  }, []);

  // Identify user when provided
  useEffect(() => {
    if (user && isReady) {
      analytics.identify(user);
    }
  }, [user, isReady]);

  const value: AnalyticsContextValue = {
    isReady,
    identify: analytics.identify.bind(analytics),
    reset: analytics.reset.bind(analytics),
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}

export default AnalyticsProvider;


