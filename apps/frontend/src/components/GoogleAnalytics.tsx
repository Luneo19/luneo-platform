/**
 * Google Analytics Component
 * GA4 Integration pour le tracking des conversions
 * Measurement ID: G-BDF4K1YYEF
 * Stream: Luneo production (https://www.luneo.app)
 */

'use client';

import React, { useEffect, memo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-BDF4K1YYEF';

function GoogleAnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

    // Track page view on route change
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    if (window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `,
        }}
      />
    </>
  );
}

const GoogleAnalyticsContentMemo = memo(GoogleAnalyticsContent);

export function GoogleAnalytics() {
  return (
    <ErrorBoundary componentName="GoogleAnalytics">
      <GoogleAnalyticsContentMemo />
    </ErrorBoundary>
  );
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

// Extend Window interface
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

