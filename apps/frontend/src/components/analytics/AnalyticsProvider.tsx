'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    // Initialize external analytics providers
    initGoogleAnalytics();
    initMixpanel();
    initRecaptcha();
    
    // Initialize centralized analytics service
    // This will handle forwarding events to GA and Mixpanel
    analytics.init();
  }, []);

  useEffect(() => {
    // Track page views via centralized service
    // AnalyticsService will forward to both GA and Mixpanel
    if (pathname) {
      analytics.trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
