'use client';

/**
 * Google Analytics Component
 * GA4 Integration pour le tracking des conversions
 * Configure via NEXT_PUBLIC_GA_MEASUREMENT_ID environment variable
 *
 * NOTE: Uses useEffect-based script injection instead of next/script
 * to avoid webpack module resolution errors in Next.js 15 dev mode.
 */

import React, { useEffect, memo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function GoogleAnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inject GA scripts once on mount
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

    // Avoid double-injection
    if (document.getElementById('ga-gtag-script')) return;

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    // gtag pushes all its arguments as a single array entry into dataLayer
    window.gtag = function gtag(command: string, targetId: string | Date, config?: Record<string, unknown>) {
      window.dataLayer.push(arguments);
    } as Window['gtag'];
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);

    // Load the gtag.js library
    const script = document.createElement('script');
    script.id = 'ga-gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('ga-gtag-script');
      if (el?.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  // Track page view on route change
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    if (window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

const GoogleAnalyticsContentMemo = memo(GoogleAnalyticsContent);

export function GoogleAnalytics() {
  return <GoogleAnalyticsContentMemo />;
}

// Helper function to track events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) {
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Helper function to track conversions
export function trackConversion(
  transactionId: string,
  value: number,
  currency: string = 'EUR'
) {
  if (typeof window === 'undefined' || !window.gtag || !GA_MEASUREMENT_ID) {
    return;
  }

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
  });
}

// Window.gtag and Window.dataLayer types are declared in
// @/lib/analytics/google-analytics.ts — no duplicate declaration needed.

