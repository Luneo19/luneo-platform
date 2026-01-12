'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGoogleAnalytics, trackPageView } from '@/lib/analytics/google-analytics';
import { initMixpanel, trackMixpanelEvent } from '@/lib/analytics/mixpanel';
import { initRecaptcha } from '@/lib/captcha/recaptcha';

/**
 * Analytics Provider Component
 * Initializes and manages all analytics tracking
 * Inspired by Vercel Analytics and Stripe tracking
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize analytics
    initGoogleAnalytics();
    initMixpanel();
    initRecaptcha();
  }, []);

  useEffect(() => {
    // Track page views
    if (pathname) {
      trackPageView(pathname);
      trackMixpanelEvent('Page View', {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname]);

  return <>{children}</>;
}
