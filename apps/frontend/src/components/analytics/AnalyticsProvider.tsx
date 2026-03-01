'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { initGoogleAnalytics } from '@/lib/analytics/google-analytics';
import { initMixpanel } from '@/lib/analytics/mixpanel';
import { initRecaptcha } from '@/lib/captcha/recaptcha';
import { analytics } from '@/lib/analytics/AnalyticsService';

/**
 * Analytics Provider Component
 * Initializes and manages all analytics tracking
 * Inspired by Vercel Analytics and Stripe tracking
 * 
 * This component:
 * - Initializes Google Analytics and Mixpanel
 * - Initializes reCAPTCHA
 * - Initializes the centralized AnalyticsService
 * - Auto-tracks page views via AnalyticsService (which forwards to GA and Mixpanel)
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const raw = localStorage.getItem('cookie-preferences');
        const parsed = raw ? (JSON.parse(raw) as { analytics?: boolean }) : null;
        setAnalyticsEnabled(Boolean(parsed?.analytics));
      } catch {
        setAnalyticsEnabled(false);
      }
    };

    loadPreferences();
    window.addEventListener('cookie-preferences-updated', loadPreferences);
    return () => window.removeEventListener('cookie-preferences-updated', loadPreferences);
  }, []);

  useEffect(() => {
    if (!analyticsEnabled) return;

    // Initialize external analytics providers only after consent
    initGoogleAnalytics();
    initMixpanel();
    initRecaptcha();
    
    // Initialize centralized analytics service
    // This will handle forwarding events to GA and Mixpanel
    analytics.init();
  }, [analyticsEnabled]);

  useEffect(() => {
    if (!analyticsEnabled) return;
    // Track page views via centralized service
    // AnalyticsService will forward to both GA and Mixpanel
    if (pathname) {
      analytics.trackPageView(pathname);
    }
  }, [analyticsEnabled, pathname]);

  return <>{children}</>;
}
